import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { pathToFileURL } from 'url';
import os from 'os';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3010;
const HOST = process.env.HOST || '0.0.0.0';
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

const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists (fallback)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize data file if not exists (fallback)
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Initialize users file if not exists (fallback)
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([
    { id: 'admin-1', username: 'admin', password: 'admin', role: 'admin' }
  ], null, 2));
}

async function initDb() {
  if (!pool) return;
  try {
    // Test connection with a simple query first
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id VARCHAR(255) PRIMARY KEY,
        case_data JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id VARCHAR(255) PRIMARY KEY,
        case_data JSON NOT NULL,
        owner_id VARCHAR(255),
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`INSERT IGNORE INTO users (id, username, password, role) VALUES ('admin-1', 'admin', 'admin', 'admin')`);
    console.log('MySQL connection successful and tables verified');
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED') {
      console.warn(`[MySQL] Connection refused at ${initialDbConfig?.host || 'localhost'}:${initialDbConfig?.port || '3306'}.`);
      console.info('[MySQL] Falling back to local file storage (data/cases.json).');
      console.info('[MySQL] To use MySQL, please ensure your database server is running and the configuration in .env or db-config.json is correct.');
    } else {
      console.error('MySQL initialization failed. Disabling MySQL and falling back to file storage:', err.message || err);
    }
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
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));

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

  // Auth: Login with database verification
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码必填' });
      }

      // Try MySQL first if pool is available
      if (pool) {
        try {
          let user;

          // Try to find user in MySQL
          const [users]: any = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

          if (users.length > 0) {
            // User exists in MySQL
            user = users[0];
          } else {
            // User not in MySQL, check file storage and sync
            const usersFile = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            const fileUser = usersFile.find((u: any) => u.username === username && u.password === password);

            if (fileUser) {
              // Sync user from file to MySQL
              await pool.query(
                'INSERT INTO users (id, username, password, email, role) VALUES (?, ?, ?, ?, ?)',
                [fileUser.id, fileUser.username, fileUser.password, fileUser.email || null, fileUser.role]
              );
              console.log(`Synced user ${username} from file to MySQL`);
              user = fileUser;
            }
          }

          if (user) {
            return res.json({
              success: true,
              user: {
                uid: user.id,
                displayName: user.username,
                email: user.email || '',
                role: user.role
              }
            });
          }
        } catch (dbErr) {
          console.error('MySQL login failed, falling back to file storage:', dbErr);
        }
      }

      // Fallback to file storage (when MySQL is not available)
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const foundUser = users.find((u: any) => u.username === username && u.password === password);
      if (foundUser) {
        return res.json({
          success: true,
          user: {
            uid: foundUser.id,
            displayName: foundUser.username,
            email: foundUser.email || '',
            role: foundUser.role
          }
        });
      }

      res.status(401).json({ success: false, message: '用户名或密码错误' });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: '登录失败' });
    }
  });

  // User Management: Register new user (admin only)
  app.post('/api/users/register', async (req, res) => {
    try {
      const { username, password, email, role = 'user' } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码必填' });
      }

      // Generate unique ID
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Always use MySQL if available
      if (pool) {
        try {
          // Check if username exists
          const [existing]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
          if (existing.length > 0) {
            return res.status(400).json({ success: false, message: '用户名已存在' });
          }

          // Insert new user into MySQL
          await pool.query(
            'INSERT INTO users (id, username, password, email, role) VALUES (?, ?, ?, ?, ?)',
            [userId, username, password, email || null, role]
          );

          console.log(`Registered user ${username} in MySQL`);
          res.json({ success: true, user: { id: userId, username, email, role } });
          return;
        } catch (dbErr: any) {
          console.error('MySQL register failed:', dbErr);
          res.status(500).json({ success: false, message: '数据库注册失败：' + dbErr.message });
          return;
        }
      }

      // Fallback to file storage only when MySQL is not available
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      if (users.find((u: any) => u.username === username)) {
        return res.status(400).json({ success: false, message: '用户名已存在' });
      }

      const newUser = { id: userId, username, password, email, role };
      users.push(newUser);
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      res.json({ success: true, user: { id: userId, username, email, role } });
    } catch (err: any) {
      console.error('Error registering user:', err);
      res.status(500).json({ success: false, message: '注册失败' });
    }
  });

  // User Management: Get all users (admin only)
  app.get('/api/users', async (req, res) => {
    try {
      if (pool) {
        try {
          const [rows]: any = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
          return res.json(rows);
        } catch (dbErr) {
          console.error('MySQL fetch users failed, falling back to file storage:', dbErr);
        }
      }

      // Fallback to file storage
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const safeUsers = users.map((u: any) => ({ id: u.id, username: u.username, email: u.email, role: u.role, created_at: u.created_at }));
      res.json(safeUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: '读取用户列表失败' });
    }
  });

  // User Management: Delete user (admin only)
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent deleting admin
      if (id === 'admin-1' || id === 'admin-id') {
        return res.status(400).json({ success: false, message: '不能删除管理员账号' });
      }

      if (pool) {
        try {
          await pool.query('DELETE FROM users WHERE id = ?', [id]);
          res.json({ success: true });
          return;
        } catch (dbErr) {
          console.error('MySQL delete user failed, falling back to file storage:', dbErr);
        }
      }

      // Fallback to file storage
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const filtered = users.filter((u: any) => u.id !== id);
      fs.writeFileSync(USERS_FILE, JSON.stringify(filtered, null, 2));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: '删除用户失败' });
    }
  });

  // Get all cases (with visibility filtering)
  // - Unauthenticated users: only public cases
  // - Authenticated users: public cases + their own private cases
  app.get('/api/cases', async (req, res) => {
    try {
      const { owner_id } = req.query;

      if (pool) {
        try {
          let query = 'SELECT case_data, owner_id, is_public FROM cases';
          const conditions: string[] = [];
          const params: any[] = [];

          // Always show public cases
          conditions.push('is_public = TRUE');

          // If user is logged in, also show their private cases
          if (owner_id) {
            conditions.push('(is_public = FALSE AND owner_id = ?)');
            params.push(owner_id);
          }

          if (conditions.length > 0) {
            query += ' WHERE (' + conditions.join(' OR ') + ')';
          }

          query += ' ORDER BY updated_at DESC';

          const [rows]: any = await pool.query(query, params);
          return res.json(rows.map((row: any) => row.case_data));
        } catch (dbErr) {
          console.error('MySQL connection failed, falling back to file storage:', dbErr);
        }
      }

      // Fallback to file storage - filter out private cases for unauthenticated users
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const cases = JSON.parse(data);

      // If no owner_id, filter out private cases (only show public)
      if (!owner_id) {
        const filteredCases = cases.filter((c: any) => c.isPublic === true);
        return res.json(filteredCases);
      }

      // If owner_id exists, show public + user's private cases
      const filteredCases = cases.filter((c: any) =>
        c.isPublic === true || (c.isPublic !== true && c.ownerId === owner_id)
      );
      res.json(filteredCases);
    } catch (err) {
      console.error('Error fetching cases:', err);
      res.status(500).json({ error: '读取数据失败' });
    }
  });

  // Save/Update case
  app.post('/api/cases', async (req, res) => {
    try {
      const incomingCase = req.body;
      // 从请求头获取用户身份信息
      const userId = (req.headers['x-user-id'] as string | undefined)?.trim();

      if (!userId) {
        return res.status(401).json({ success: false, message: '未登录或登录已失效' });
      }

      if (!incomingCase?.id) {
        return res.status(400).json({ success: false, message: '案例 id 缺失' });
      }

      // 使用严格类型转换确保 isPublic 为 boolean 值，避免 undefined 被转为 false
      const isPublic = incomingCase.isPublic === true;
      console.log(`[Save Case] id=${incomingCase.id}, isPublic=${isPublic}, inputType=${typeof incomingCase.isPublic}, inputValue=${incomingCase.isPublic}`);

      if (pool) {
        try {
          const [existingRows]: any = await pool.query(
            'SELECT owner_id FROM cases WHERE id = ? LIMIT 1',
            [incomingCase.id]
          );
          const existingOwnerId = existingRows.length > 0 ? existingRows[0].owner_id : null;

          // 无论角色如何，均禁止修改他人案例
          if (existingOwnerId && existingOwnerId !== userId) {
            return res.status(403).json({ success: false, message: '无权修改他人案例' });
          }

          const validatedOwnerId = existingOwnerId || userId;
          const sanitizedCase = { ...incomingCase, ownerId: validatedOwnerId };

          // Ensure owner exists in MySQL to satisfy FK
          const [users]: any = await pool.query('SELECT id FROM users WHERE id = ?', [validatedOwnerId]);
          if (users.length === 0) {
            const usersFile = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            const fileUser = usersFile.find((u: any) => u.id === validatedOwnerId);
            if (!fileUser) {
              return res.status(403).json({ success: false, message: '无效用户，无法保存案例' });
            }
            await pool.query(
              'INSERT INTO users (id, username, password, email, role) VALUES (?, ?, ?, ?, ?)',
              [fileUser.id, fileUser.username, fileUser.password, fileUser.email || null, fileUser.role]
            );
            console.log(`Synced user ${fileUser.username} from file to MySQL during case save`);
          }

          await pool.query(
            'INSERT INTO cases (id, case_data, owner_id, is_public) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE case_data = ?, owner_id = ?, is_public = ?',
            [sanitizedCase.id, JSON.stringify(sanitizedCase), validatedOwnerId, isPublic, JSON.stringify(sanitizedCase), validatedOwnerId, isPublic]
          );

          const [rows]: any = await pool.query('SELECT case_data FROM cases ORDER BY updated_at DESC');
          const allCases = rows.map((row: any) => row.case_data);
          io.emit('cases_updated', allCases);
          return res.json({ success: true });
        } catch (dbErr: any) {
          console.error('MySQL save failed:', dbErr);
        }
      }

      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const index = data.findIndex((c: any) => c.id === incomingCase.id);
      if (index !== -1) {
        const existingOwnerId = data[index]?.ownerId;
        if (existingOwnerId && existingOwnerId !== userId) {
          return res.status(403).json({ success: false, message: '无权修改他人案例' });
        }
        data[index] = { ...incomingCase, ownerId: existingOwnerId || userId };
      } else {
        data.push({ ...incomingCase, ownerId: userId });
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
      // Inline configuration to bypass vite.config.ts loading issues in Node v23/tsx
      configFile: false,
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(process.cwd(), '.'),
        },
      },
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        host: true, // 允许局域网访问 Vite HMR 热更新
        cors: true
      },
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

  httpServer.listen(PORT, HOST, () => {
    console.log(`\n  Vite + Express Server running!`);
    console.log(`  ➜  Local:   http://localhost:${PORT}`);
    
    // Print local LAN IPs for easy access
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`  ➜  Network: http://${net.address}:${PORT}`);
        }
      }
    }
    console.log('');
  });
}

startServer();
