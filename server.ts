import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import os from 'os';
import crypto from 'crypto';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { REQUIRED_SCHEMA_VERSION } from './schemaVersion';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3004;
const HOST = process.env.HOST || '0.0.0.0';

type DbConfig = {
  host: string;
  port: number | string;
  user: string;
  password: string;
  database: string;
};

function formatDbConnectionHint(err: unknown, host: string): string {
  const msg = err instanceof Error ? err.message : String(err || 'Unknown error');
  const h = String(host || '').trim().toLowerCase();
  if (/ENOTFOUND|getaddrinfo/i.test(msg) && (h === 'mysql-server' || h.includes('mysql-server'))) {
    return `${msg}。提示：「mysql-server」是 Compose 服务名，仅在「API 与 MySQL 在同一 Docker 网络」的容器内可解析。若 API 在本机直接运行（如 tsx server.ts），请把主机改为 127.0.0.1 或 localhost，并保证 MySQL 端口已映射到本机。`;
  }
  if (/ENOTFOUND|getaddrinfo/i.test(msg)) {
    return `${msg}。请确认主机名/IP 正确，且运行 API 的机器能访问该地址。`;
  }
  return msg;
}

type CaseType = 'openclaw_app' | 'tool_app' | 'agent_app' | 'rpa_app' | 'dashboard_app';
type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  umNumber: string;
  email: string;
  team: string;
  organization: string;
  defaultCasePublic: boolean;
  role: string;
};
type AuthenticatedRequest = express.Request & { authUser?: AuthUser | null };

const envDbConfig: DbConfig | null = process.env.DB_HOST
  ? {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '',
    }
  : null;

let activeDbConfig: DbConfig | null = envDbConfig;
let pool: mysql.Pool | null = null;
const AUTH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_SECRET = process.env.AUTH_SECRET || `${process.env.DB_PASSWORD || 'openclaw'}:${process.env.DB_NAME || 'platform'}`;
const PASSWORD_PREFIX = 'scrypt';

const toBase64Url = (value: Buffer | string) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64');
};

const signTokenPayload = (encodedPayload: string) =>
  toBase64Url(crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest());

const createAuthToken = (user: AuthUser) => {
  const encodedPayload = toBase64Url(
    JSON.stringify({
      uid: user.id,
      username: user.username,
      displayName: user.displayName,
      umNumber: user.umNumber,
      email: user.email || '',
      team: user.team,
      organization: user.organization,
      defaultCasePublic: user.defaultCasePublic === true,
      role: user.role,
      exp: Date.now() + AUTH_TOKEN_TTL_MS,
    })
  );
  return `${encodedPayload}.${signTokenPayload(encodedPayload)}`;
};

const parseAuthToken = (token: string): AuthUser | null => {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  const expectedSignature = signTokenPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return null;
  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8'));
    if (!payload?.uid || !payload?.role || !payload?.exp || payload.exp < Date.now()) return null;
    return {
      id: payload.uid,
      username: payload.username || '',
      displayName: payload.displayName || payload.username || '',
      umNumber: payload.umNumber || payload.username || '',
      email: payload.email || '',
      team: payload.team || '',
      organization: payload.organization || '财服总部',
      defaultCasePublic: payload.defaultCasePublic === true,
      role: payload.role,
    };
  } catch (_error) {
    return null;
  }
};

const extractAuthToken = (req: express.Request) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return null;
  return authorization.slice(7).trim() || null;
};

const getAuthUser = (req: express.Request) => (req as AuthenticatedRequest).authUser || null;

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${PASSWORD_PREFIX}$${salt}$${derivedKey}`;
};

const verifyPassword = (storedPassword: string, rawPassword: string) => {
  if (!storedPassword) return false;
  if (!storedPassword.startsWith(`${PASSWORD_PREFIX}$`)) {
    return storedPassword === rawPassword;
  }
  const [, salt, hashedValue] = storedPassword.split('$');
  if (!salt || !hashedValue) return false;
  const derivedKey = crypto.scryptSync(rawPassword, salt, 64).toString('hex');
  const expectedBuffer = Buffer.from(hashedValue, 'hex');
  const actualBuffer = Buffer.from(derivedKey, 'hex');
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

const ensureCaseLikeFields = (caseData: any) => {
  const likeCount = Number.isFinite(caseData?.likeCount) ? Math.max(0, Number(caseData.likeCount)) : 0;
  const likedByKeys = Array.isArray(caseData?.likedByKeys)
    ? Array.from(new Set(caseData.likedByKeys.filter((k: any) => typeof k === 'string' && k.trim().length > 0)))
    : [];
  return {
    ...caseData,
    likeCount,
    likedByKeys,
    caseType: (caseData?.caseType as CaseType) || 'openclaw_app',
  };
};

const getVisitorKey = (req: express.Request) => {
  const authUser = getAuthUser(req);
  if (authUser?.id) return `uid:${authUser.id}`;
  const userAgent = (req.headers['user-agent'] as string | undefined) || 'unknown-agent';
  const raw = `${req.ip}|${userAgent}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);
  return `anon:${hash}`;
};

const createBootstrapCases = () => {
  const now = Date.now();
  return [
    ensureCaseLikeFields({
      id: 'bootstrap-sample-1',
      title: 'OpenClaw 自动化报表生成案例',
      subtitle: '系统初始化样例：财务月报自动汇总与分发',
      status: 'published',
      version: 1.0,
      lastModified: now,
      author: '系统示例',
      umNumber: 'SYS-001',
      team: '系统初始化',
      organization: '财服总部',
      ownerId: 'admin-1',
      caseType: 'openclaw_app',
      isPublic: true,
      challenges: {
        background: '系统初始化示例数据',
        painPoints: ['跨系统数据导出繁琐', '汇总耗时'],
        objectives: '自动化报表处理流程',
      },
      implementation: {
        steps: [
          { id: 's1', title: '自动抓取', description: '抓取源系统数据', imageUrl: '' },
          { id: 's2', title: '清洗汇总', description: '执行标准化与汇总', imageUrl: '' },
        ],
      },
      businessValue: {
        metrics: [{ id: 'm1', label: '效率提升', value: '90%', subtext: '显著缩短处理时间', icon: 'trending-up' }],
        footerNote: '系统初始化样例',
      },
      roadmap: {
        items: [{ id: 'r1', task: '能力扩展', content: '扩展更多场景', date: '2026.06' }],
      },
    }),
    ensureCaseLikeFields({
      id: 'bootstrap-sample-2',
      title: '智能客服工单分类样例',
      subtitle: '系统初始化样例：工单自动分类与分派',
      status: 'published',
      version: 1.0,
      lastModified: now,
      author: '系统示例',
      umNumber: 'SYS-002',
      team: '系统初始化',
      organization: '深圳分公司',
      ownerId: 'admin-1',
      caseType: 'openclaw_app',
      isPublic: true,
      challenges: {
        background: '系统初始化示例数据',
        painPoints: ['工单积压', '分派误差'],
        objectives: '提升工单处理效率',
      },
      implementation: {
        steps: [
          { id: 's1', title: '实时抓取', description: '抓取新工单', imageUrl: '' },
          { id: 's2', title: '自动分派', description: '按规则分配工单', imageUrl: '' },
        ],
      },
      businessValue: {
        metrics: [{ id: 'm1', label: '响应时间', value: '-80%', subtext: '明显提升处理速度', icon: 'clock' }],
        footerNote: '系统初始化样例',
      },
      roadmap: {
        items: [{ id: 'r1', task: '质量优化', content: '持续优化分类准确率', date: '2026.07' }],
      },
    }),
  ];
};

async function verifySchemaVersion() {
  if (!pool) throw new Error('MySQL pool not initialized');
  const [tableRows]: any = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'schema_migrations'
    `
  );
  if (Number(tableRows?.[0]?.total ?? 0) === 0) {
    throw new Error(
      'schema_migrations not found. Please run database migrations first: npm run migrate'
    );
  }

  const [requiredRows]: any = await pool.query(
    'SELECT version FROM schema_migrations WHERE version = ? LIMIT 1',
    [REQUIRED_SCHEMA_VERSION]
  );
  if (!requiredRows.length) {
    const [latestRows]: any = await pool.query(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    const currentVersion = latestRows?.[0]?.version || 'none';
    throw new Error(
      `Schema version mismatch. current=${currentVersion}, required=${REQUIRED_SCHEMA_VERSION}. Please run: npm run migrate`
    );
  }
}

async function ensureBootstrapAdmin() {
  if (!pool) throw new Error('MySQL pool not initialized');
  const defaultAdminPassword = hashPassword('admin');
  await pool.query(
    `
      INSERT INTO users (id, username, um_number, real_name, team, organization, default_case_public, password, role)
      VALUES ('admin-1', 'admin', 'admin', '系统管理员', '平台运维', '财服总部', FALSE, ?, 'admin')
      ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        um_number = VALUES(um_number),
        real_name = VALUES(real_name),
        team = VALUES(team),
        organization = VALUES(organization),
        default_case_public = VALUES(default_case_public),
        password = VALUES(password),
        role = VALUES(role)
    `,
    [defaultAdminPassword]
  );
}

async function createPool(config: DbConfig) {
  if (pool) await pool.end();
  pool = mysql.createPool({
    host: config.host,
    port: parseInt(String(config.port || '3306'), 10),
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  const connection = await pool.getConnection();
  await connection.query('SELECT 1');
  connection.release();
  await verifySchemaVersion();
  await ensureBootstrapAdmin();
  activeDbConfig = config;
  console.log('[MySQL] connected and verified');
}

function requirePool(): mysql.Pool {
  if (!pool) throw new Error('DATABASE_UNAVAILABLE');
  return pool;
}

async function startServer() {
  if (!envDbConfig) throw new Error('MySQL is required. Missing DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.');
  await createPool(envDbConfig);

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

  app.use(cors());
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));
  app.use((req, _res, next) => {
    const token = extractAuthToken(req);
    (req as AuthenticatedRequest).authUser = token ? parseAuthToken(token) : null;
    next();
  });

  const requireAuth: express.RequestHandler = (req, res, next) => {
    const authUser = getAuthUser(req);
    if (!authUser) {
      res.status(401).json({ success: false, message: '未登录或登录已失效' });
      return;
    }
    next();
  };

  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const authUser = getAuthUser(req);
    if (!authUser) {
      res.status(401).json({ success: false, message: '未登录或登录已失效' });
      return;
    }
    if (authUser.role !== 'admin') {
      res.status(403).json({ success: false, message: '仅管理员可执行该操作' });
      return;
    }
    next();
  };

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', service: 'api', timestamp: Date.now() });
  });

  app.get('/api/health/db', async (_req, res) => {
    try {
      await requirePool().query('SELECT 1');
      res.json({ success: true, status: 'ok', database: activeDbConfig?.database || null, timestamp: Date.now() });
    } catch (error: any) {
      res.status(503).json({ success: false, status: 'error', message: error?.message || '数据库不可用' });
    }
  });

  app.get('/api/db-config', requireAdmin, (_req, res) => {
    if (!activeDbConfig) return res.json(null);
    res.json({ ...activeDbConfig, password: activeDbConfig.password ? '********' : '' });
  });

  app.post('/api/db-config', requireAdmin, async (req, res) => {
    try {
      await createPool(req.body as DbConfig);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: formatDbConnectionHint(err, (req.body as DbConfig)?.host || ''),
      });
    }
  });

  app.post('/api/db-config/test', requireAdmin, async (req, res) => {
    const config = req.body as DbConfig;
    try {
      const testPool = mysql.createPool({
        host: config.host,
        port: parseInt(String(config.port || '3306'), 10),
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 1,
        connectTimeout: 5000,
      });
      const connection = await testPool.getConnection();
      connection.release();
      await testPool.end();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: formatDbConnectionHint(error, config.host || ''),
      });
    }
  });

  app.post('/api/db-config/reset', requireAdmin, (_req, res) => {
    res.status(410).json({ success: false, message: '当前版本不支持文件模式' });
  });

  app.post('/api/login', async (req, res) => {
    try {
      const umNumber = typeof req.body?.umNumber === 'string'
        ? req.body.umNumber.trim()
        : (typeof req.body?.username === 'string' ? req.body.username.trim() : '');
      const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
      if (!umNumber || !password) return res.status(400).json({ success: false, message: 'UM号和密码必填' });
      const [users]: any = await requirePool().query(
        `
          SELECT id, username, um_number, real_name, email, team, organization, default_case_public, role, password
          FROM users
          WHERE um_number = ? OR username = ?
          ORDER BY CASE WHEN um_number = ? THEN 0 ELSE 1 END
          LIMIT 1
        `,
        [umNumber, umNumber, umNumber]
      );
      if (!users.length || !verifyPassword(users[0].password, password)) {
        return res.status(401).json({ success: false, message: 'UM号或密码错误' });
      }
      const user = users[0];
      if (!String(user.password || '').startsWith(`${PASSWORD_PREFIX}$`)) {
        await requirePool().query('UPDATE users SET password = ? WHERE id = ?', [hashPassword(password), user.id]);
      }
      const authUser: AuthUser = {
        id: user.id,
        username: user.username || user.um_number,
        displayName: user.real_name || user.username || user.um_number,
        umNumber: user.um_number || user.username,
        email: user.email || '',
        team: user.team || '',
        organization: user.organization || '财服总部',
        defaultCasePublic: user.default_case_public === true,
        role: user.role,
      };
      res.json({
        success: true,
        token: createAuthToken(authUser),
        user: {
          uid: user.id,
          displayName: authUser.displayName,
          username: authUser.username,
          umNumber: authUser.umNumber,
          email: authUser.email,
          team: authUser.team,
          organization: authUser.organization,
          defaultCasePublic: authUser.defaultCasePublic,
          role: authUser.role,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: err?.message || '登录失败' });
    }
  });

  app.post('/api/users/register', requireAdmin, async (req, res) => {
    try {
      const realName = typeof req.body?.realName === 'string' ? req.body.realName.trim() : '';
      const umNumber = typeof req.body?.umNumber === 'string' ? req.body.umNumber.trim() : '';
      const team = typeof req.body?.team === 'string' ? req.body.team.trim() : '';
      const organization = typeof req.body?.organization === 'string' ? req.body.organization.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
      const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
      const role = req.body?.role === 'admin' ? 'admin' : 'user';
      if (!realName || !umNumber || !team || !organization || !password) {
        return res.status(400).json({ success: false, message: '姓名、UM号、所属团队、所属组织和密码必填' });
      }
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const [existing]: any = await requirePool().query('SELECT id FROM users WHERE um_number = ?', [umNumber]);
      if (existing.length > 0) return res.status(400).json({ success: false, message: 'UM号已存在' });
      await requirePool().query(
        `
          INSERT INTO users (id, username, um_number, real_name, team, organization, default_case_public, password, email, role)
          VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?)
        `,
        [userId, umNumber, umNumber, realName, team, organization, hashPassword(password), email || null, role]
      );
      res.json({
        success: true,
        user: { id: userId, username: umNumber, umNumber, realName, team, organization, email, role, defaultCasePublic: false },
      });
    } catch (err: any) {
      console.error('Error registering user:', err);
      res.status(500).json({ success: false, message: err?.message || '注册失败' });
    }
  });

  app.get('/api/users', requireAdmin, async (_req, res) => {
    try {
      const [rows]: any = await requirePool().query(
        `
          SELECT id, username, um_number, real_name, team, organization, email, role, default_case_public, created_at
          FROM users
          ORDER BY created_at DESC
        `
      );
      res.json(rows);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: err?.message || '读取用户列表失败' });
    }
  });

  app.patch('/api/users/me/preferences', requireAuth, async (req, res) => {
    try {
      const authUser = getAuthUser(req)!;
      const defaultCasePublic = req.body?.defaultCasePublic === true;
      await requirePool().query('UPDATE users SET default_case_public = ? WHERE id = ?', [defaultCasePublic, authUser.id]);
      const [rows]: any = await requirePool().query(
        'SELECT id, username, um_number, real_name, email, team, organization, default_case_public, role FROM users WHERE id = ? LIMIT 1',
        [authUser.id]
      );
      if (!rows.length) return res.status(404).json({ success: false, message: '用户不存在' });
      const next = rows[0];
      res.json({
        success: true,
        user: {
          uid: next.id,
          displayName: next.real_name || next.username || next.um_number,
          username: next.username || next.um_number,
          umNumber: next.um_number || next.username,
          email: next.email || '',
          team: next.team || '',
          organization: next.organization || '财服总部',
          defaultCasePublic: next.default_case_public === true,
          role: next.role,
        },
      });
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      res.status(500).json({ success: false, message: err?.message || '更新偏好失败' });
    }
  });

  app.post('/api/users/me/password', requireAuth, async (req, res) => {
    try {
      const authUser = getAuthUser(req)!;
      const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
      const nextPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
      if (!currentPassword || !nextPassword) {
        return res.status(400).json({ success: false, message: '当前密码和新密码必填' });
      }
      if (nextPassword.trim().length < 6) {
        return res.status(400).json({ success: false, message: '新密码长度至少 6 位' });
      }
      const [rows]: any = await requirePool().query('SELECT id, password FROM users WHERE id = ? LIMIT 1', [authUser.id]);
      if (!rows.length) return res.status(404).json({ success: false, message: '用户不存在' });
      if (!verifyPassword(rows[0].password || '', currentPassword)) {
        return res.status(400).json({ success: false, message: '当前密码不正确' });
      }
      await requirePool().query('UPDATE users SET password = ? WHERE id = ?', [hashPassword(nextPassword.trim()), authUser.id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error changing password:', err);
      res.status(500).json({ success: false, message: err?.message || '修改密码失败' });
    }
  });

  app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      if (id === 'admin-1') return res.status(400).json({ success: false, message: '不能删除管理员账号' });
      await requirePool().query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: err?.message || '删除用户失败' });
    }
  });

  app.get('/api/cases', async (req, res) => {
    try {
      const { case_type } = req.query;
      const authUser = getAuthUser(req);
      let query = 'SELECT case_data FROM cases WHERE is_public = TRUE';
      const params: any[] = [];
      if (authUser?.id) {
        query += ' OR owner_id = ?';
        params.push(authUser.id);
      }
      if (case_type && typeof case_type === 'string') {
        query = `SELECT case_data FROM cases WHERE (${query.replace('SELECT case_data FROM cases WHERE ', '')}) AND case_type = ?`;
        params.push(case_type);
      }
      query += ' ORDER BY updated_at DESC LIMIT 500';
      const [rows]: any = await requirePool().query(query, params);
      res.json(rows.map((row: any) => ensureCaseLikeFields(row.case_data)));
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      res.status(500).json({ error: err?.message || '读取数据失败' });
    }
  });

  app.post('/api/cases/bootstrap', async (_req, res) => {
    try {
      const [countRows]: any = await requirePool().query('SELECT COUNT(*) AS total FROM cases');
      const total = Number(countRows?.[0]?.total ?? 0);
      if (total > 0) return res.json({ success: true, inserted: 0 });
      const bootstrapCases = createBootstrapCases();
      for (const c of bootstrapCases) {
        await requirePool().query(
          'INSERT INTO cases (id, case_data, case_type, owner_id, is_public) VALUES (?, ?, ?, ?, ?)',
          [c.id, JSON.stringify(c), c.caseType || 'openclaw_app', 'admin-1', true]
        );
      }
      io.emit('cases_updated', { event: 'refresh' });
      res.json({ success: true, inserted: bootstrapCases.length });
    } catch (err: any) {
      console.error('Error bootstrapping cases:', err);
      res.status(500).json({ success: false, message: err?.message || '初始化案例失败' });
    }
  });

  app.post('/api/cases/:id/like', async (req, res) => {
    try {
      const { id } = req.params;
      const visitorKey = getVisitorKey(req);
      const [targetRows]: any = await requirePool().query('SELECT case_data FROM cases WHERE id = ? LIMIT 1', [id]);
      if (!targetRows.length) return res.status(404).json({ success: false, message: '案例不存在' });
      const targetCase = ensureCaseLikeFields(targetRows[0].case_data);
      if (targetCase.isPublic !== true) return res.status(403).json({ success: false, message: '仅公开案例可点赞' });
      if (targetCase.likedByKeys.includes(visitorKey)) {
        return res.status(200).json({ success: true, duplicated: true, likeCount: targetCase.likeCount });
      }
      const nextCase = { ...targetCase, likeCount: targetCase.likeCount + 1, likedByKeys: [...targetCase.likedByKeys, visitorKey] };
      await requirePool().query('UPDATE cases SET case_data = ?, is_public = ? WHERE id = ?', [
        JSON.stringify(nextCase),
        nextCase.isPublic === true,
        id,
      ]);
      io.emit('cases_updated', { event: 'refresh' });
      res.json({ success: true, duplicated: false, likeCount: nextCase.likeCount });
    } catch (err: any) {
      console.error('Error liking case:', err);
      res.status(500).json({ success: false, message: err?.message || '点赞失败' });
    }
  });

  app.post('/api/cases', requireAuth, async (req, res) => {
    try {
      const incomingCase = req.body;
      const authUser = getAuthUser(req)!;
      const userId = authUser.id;
      if (!incomingCase?.id) return res.status(400).json({ success: false, message: '案例 id 缺失' });

      const [existingRows]: any = await requirePool().query('SELECT owner_id, case_data FROM cases WHERE id = ? LIMIT 1', [incomingCase.id]);
      const existingOwnerId = existingRows.length > 0 ? existingRows[0].owner_id : null;
      const existingCaseData = existingRows.length > 0 ? ensureCaseLikeFields(existingRows[0].case_data) : null;
      if (existingOwnerId && existingOwnerId !== userId) return res.status(403).json({ success: false, message: '无权修改他人案例' });
      const validatedOwnerId = existingOwnerId || userId;
      const [users]: any = await requirePool().query('SELECT id FROM users WHERE id = ?', [validatedOwnerId]);
      if (users.length === 0) return res.status(403).json({ success: false, message: '无效用户，无法保存案例' });

      const sanitizedCase = ensureCaseLikeFields({
        ...incomingCase,
        ownerId: validatedOwnerId,
        likeCount: existingCaseData?.likeCount ?? incomingCase?.likeCount ?? 0,
        likedByKeys: existingCaseData?.likedByKeys ?? incomingCase?.likedByKeys ?? [],
      });
      const isPublic = sanitizedCase.isPublic === true;
      const caseType = sanitizedCase.caseType || 'openclaw_app';
      await requirePool().query(
        'INSERT INTO cases (id, case_data, case_type, owner_id, is_public) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE case_data = ?, case_type = ?, owner_id = ?, is_public = ?',
        [
          sanitizedCase.id,
          JSON.stringify(sanitizedCase),
          caseType,
          validatedOwnerId,
          isPublic,
          JSON.stringify(sanitizedCase),
          caseType,
          validatedOwnerId,
          isPublic,
        ]
      );
      io.emit('cases_updated', { event: 'refresh' });
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error saving case:', err);
      res.status(500).json({ error: err?.message || '保存数据失败' });
    }
  });

  app.delete('/api/cases/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthUser(req)!.id;
      const [targetRows]: any = await requirePool().query('SELECT owner_id, case_data FROM cases WHERE id = ? LIMIT 1', [id]);
      if (!targetRows.length) return res.status(404).json({ success: false, message: '案例不存在' });
      const targetOwnerId = targetRows[0].owner_id;
      const targetCaseData = targetRows[0].case_data;
      if (!targetOwnerId || targetOwnerId !== userId) return res.status(403).json({ success: false, message: '无权删除他人案例' });
      if (targetCaseData?.isPublic === true) return res.status(403).json({ success: false, message: '仅允许删除自己私密案例' });
      await requirePool().query('DELETE FROM cases WHERE id = ?', [id]);
      io.emit('cases_updated', { event: 'refresh' });
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting case:', err);
      res.status(500).json({ error: err?.message || '删除数据失败' });
    }
  });

  // ── Case Comments ──

  app.get('/api/cases/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows]: any = await requirePool().query(
        'SELECT id, case_id, user_id, username, content, created_at FROM case_comments WHERE case_id = ? ORDER BY created_at ASC LIMIT 200',
        [id]
      );
      res.json(rows);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      res.status(500).json({ error: err?.message || '读取留言失败' });
    }
  });

  app.post('/api/cases/:id/comments', requireAuth, async (req, res) => {
    try {
      const { id: caseId } = req.params;
      const authUser = getAuthUser(req)!;
      const { content } = req.body;
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: '留言内容不能为空' });
      }
      if (content.length > 500) {
        return res.status(400).json({ success: false, message: '留言内容不能超过 500 字' });
      }
      const [caseRows]: any = await requirePool().query('SELECT id FROM cases WHERE id = ? LIMIT 1', [caseId]);
      if (!caseRows.length) return res.status(404).json({ success: false, message: '案例不存在' });

      const commentId = `cmt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      await requirePool().query(
        'INSERT INTO case_comments (id, case_id, user_id, username, content) VALUES (?, ?, ?, ?, ?)',
        [commentId, caseId, authUser.id, authUser.displayName || authUser.username, content.trim()]
      );
      const [newRow]: any = await requirePool().query(
        'SELECT id, case_id, user_id, username, content, created_at FROM case_comments WHERE id = ?',
        [commentId]
      );
      res.json({ success: true, comment: newRow[0] });
    } catch (err: any) {
      console.error('Error posting comment:', err);
      res.status(500).json({ success: false, message: err?.message || '留言失败' });
    }
  });

  app.delete('/api/comments/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const authUser = getAuthUser(req)!;
      const [rows]: any = await requirePool().query('SELECT user_id FROM case_comments WHERE id = ? LIMIT 1', [id]);
      if (!rows.length) return res.status(404).json({ success: false, message: '留言不存在' });
      if (rows[0].user_id !== authUser.id && authUser.role !== 'admin') {
        return res.status(403).json({ success: false, message: '只能删除自己的留言' });
      }
      await requirePool().query('DELETE FROM case_comments WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      res.status(500).json({ success: false, message: err?.message || '删除留言失败' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: false,
      plugins: [react(), tailwindcss()],
      define: { 'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY) },
      resolve: { alias: { '@': path.resolve(process.cwd(), '.') } },
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true', host: true, cors: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => console.log('User disconnected:', socket.id));
  });

  httpServer.listen(PORT, HOST, () => {
    console.log(`\n  Vite + Express Server running!`);
    console.log(`  ➜  Local:   http://localhost:${PORT}`);
    try {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name] || []) {
          if (net.family === 'IPv4' && !net.internal) console.log(`  ➜  Network: http://${net.address}:${PORT}`);
        }
      }
    } catch (_error) {
      console.warn('  ➜  Network addresses unavailable in current runtime');
    }
    console.log('');
  });
}

startServer().catch((error) => {
  console.error('[Startup] Fatal error:', error?.message || error);
  process.exit(1);
});
