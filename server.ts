import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cases.json');
const DB_CONFIG_FILE = path.join(DATA_DIR, 'db-config.json');

// MySQL Pool
let pool: mysql.Pool | null = null;

async function createPool(config: any) {
  if (pool) {
    await pool.end();
  }
  
  if (!config || !config.host) {
    pool = null;
    return;
  }

  pool = mysql.createPool({
    host: config.host,
    port: parseInt(config.port || '3306'),
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('MySQL pool created/updated');
  await initDb();
}

// Load initial config
let initialDbConfig = null;
if (fs.existsSync(DB_CONFIG_FILE)) {
  try {
    initialDbConfig = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to parse db-config.json');
  }
} else if (process.env.DB_HOST) {
  initialDbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };
}

// Ensure data directory exists (fallback)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize data file if not exists (fallback)
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

async function initDb() {
  if (!pool) return;
  try {
    // Test connection with a simple query first
    await pool.query('SELECT 1');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id VARCHAR(255) PRIMARY KEY,
        case_data JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('MySQL connection successful and table "cases" verified');
  } catch (err) {
    console.error('MySQL initialization failed. Disabling MySQL and falling back to file storage:', err);
    // If we can't connect or init, disable the pool to avoid repeated failures
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }
  }
}

async function startServer() {
  if (initialDbConfig) {
    await createPool(initialDbConfig);
  }

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API Routes ---

  // DB Config: Get current config
  app.get('/api/db-config', (req, res) => {
    if (fs.existsSync(DB_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf8'));
      // Don't send password back for security, or mask it
      res.json({ ...config, password: config.password ? '********' : '' });
    } else if (initialDbConfig) {
      res.json({ ...initialDbConfig, password: initialDbConfig.password ? '********' : '' });
    } else {
      res.json(null);
    }
  });

  // DB Config: Update config
  app.post('/api/db-config', async (req, res) => {
    try {
      const newConfig = req.body;
      
      // Test connection before saving
      const testPool = mysql.createPool({
        host: newConfig.host,
        port: parseInt(newConfig.port || '3306'),
        user: newConfig.user,
        password: newConfig.password,
        database: newConfig.database,
        connectTimeout: 5000
      });

      try {
        await testPool.query('SELECT 1');
        await testPool.end();
      } catch (err: any) {
        return res.status(400).json({ success: false, message: `连接失败: ${err.message}` });
      }

      // Save to file
      fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(newConfig, null, 2));
      
      // Update active pool
      await createPool(newConfig);
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // DB Config: Test Connection
  app.post('/api/db-config/test', async (req, res) => {
    const config = req.body;
    try {
      const testPool = mysql.createPool({
        ...config,
        waitForConnections: true,
        connectionLimit: 1,
        connectTimeout: 5000
      });
      const connection = await testPool.getConnection();
      connection.release();
      await testPool.end();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Test connection failed:', error);
      res.json({ success: false, message: error.message || 'Unknown error' });
    }
  });

  // DB Config: Disconnect/Reset to File Mode
  app.post('/api/db-config/reset', async (req, res) => {
    if (fs.existsSync(DB_CONFIG_FILE)) {
      fs.unlinkSync(DB_CONFIG_FILE);
    }
    if (pool) {
      await pool.end();
      pool = null;
    }
    res.json({ success: true });
  });

  // Auth: Simplified admin login
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
      res.json({ 
        success: true, 
        user: { 
          uid: 'admin-id', 
          displayName: '管理员', 
          email: 'admin@internal.com',
          role: 'admin'
        } 
      });
    } else {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  });

  // Get all cases
  app.get('/api/cases', async (req, res) => {
    try {
      if (pool) {
        try {
          const [rows]: any = await pool.query('SELECT case_data FROM cases ORDER BY updated_at DESC');
          return res.json(rows.map((row: any) => row.case_data));
        } catch (dbErr) {
          console.error('MySQL connection failed, falling back to file storage:', dbErr);
          // Don't return, continue to file fallback
        }
      }
      
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      res.json(JSON.parse(data));
    } catch (err) {
      console.error('Error fetching cases:', err);
      res.status(500).json({ error: '读取数据失败' });
    }
  });

  // Save/Update case
  app.post('/api/cases', async (req, res) => {
    try {
      const newCase = req.body;
      
      if (pool) {
        try {
          await pool.query(
            'INSERT INTO cases (id, case_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE case_data = ?',
            [newCase.id, JSON.stringify(newCase), JSON.stringify(newCase)]
          );
          
          const [rows]: any = await pool.query('SELECT case_data FROM cases ORDER BY updated_at DESC');
          const allCases = rows.map((row: any) => row.case_data);
          io.emit('cases_updated', allCases);
          return res.json({ success: true });
        } catch (dbErr) {
          console.error('MySQL save failed, falling back to file storage:', dbErr);
        }
      }

      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const index = data.findIndex((c: any) => c.id === newCase.id);
      if (index !== -1) {
        data[index] = newCase;
      } else {
        data.push(newCase);
      }
      
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      io.emit('cases_updated', data);
      res.json({ success: true });
    } catch (err) {
      console.error('Error saving case:', err);
      res.status(500).json({ error: '保存数据失败' });
    }
  });

  // Delete case
  app.delete('/api/cases/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (pool) {
        try {
          await pool.query('DELETE FROM cases WHERE id = ?', [id]);
          const [rows]: any = await pool.query('SELECT case_data FROM cases ORDER BY updated_at DESC');
          const allCases = rows.map((row: any) => row.case_data);
          io.emit('cases_updated', allCases);
          return res.json({ success: true });
        } catch (dbErr) {
          console.error('MySQL delete failed, falling back to file storage:', dbErr);
        }
      }

      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const filtered = data.filter((c: any) => c.id !== id);
      fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
      io.emit('cases_updated', filtered);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting case:', err);
      res.status(500).json({ error: '删除数据失败' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- Socket.io ---
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
