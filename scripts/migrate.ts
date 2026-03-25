import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { REQUIRED_SCHEMA_VERSION } from '../schemaVersion';

dotenv.config();

const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT || 3306);
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME;

if (!dbHost || !dbUser || !dbName) {
  throw new Error('Missing DB_HOST/DB_USER/DB_NAME for migration.');
}

const ensureDatabase = async () => {
  const conn = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    multipleStatements: true,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await conn.end();
};

const ensureMigrationTable = async (pool: mysql.Pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(32) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const run = async () => {
  await ensureDatabase();

  const pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0,
    multipleStatements: true,
  });

  try {
    await ensureMigrationTable(pool);

    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = (await fs.readdir(migrationsDir))
      .filter((f) => /^\d+_.+\.sql$/.test(f))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const version = file.split('_')[0];
      const [rows]: any = await pool.query('SELECT version FROM schema_migrations WHERE version = ? LIMIT 1', [version]);
      if (rows.length > 0) {
        console.log(`[migrate] skip ${file} (already applied)`);
        continue;
      }

      console.log(`[migrate] applying ${file}`);
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (version, filename) VALUES (?, ?)', [version, file]);
      console.log(`[migrate] applied ${file}`);
    }

    const [versionRows]: any = await pool.query(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    const currentVersion = versionRows?.[0]?.version || 'none';
    console.log(`[migrate] current schema version: ${currentVersion}, required: ${REQUIRED_SCHEMA_VERSION}`);
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error('[migrate] fatal:', error?.message || error);
  process.exit(1);
});
