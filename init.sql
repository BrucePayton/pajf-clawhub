CREATE DATABASE IF NOT EXISTS OpenclawAppPlatform;
USE OpenclawAppPlatform;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(32) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 业务表结构由 migrations/*.sql 管理，请通过 `npm run migrate` 执行迁移。