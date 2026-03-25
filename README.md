<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6c0bc6e9-62f0-4791-8f82-43247eb427fd

## 项目概览

### 项目名称
OpenClawCaseCollection（基于 React + Vite 的案件管理与展示系统）

### 设计目标
- 提供可视化和可编辑的案件信息管理界面
- 统一使用 MySQL 作为唯一存储
- 实现动态 PPT 导出与下载（基于 `pptxgenjs`）
- 支持 Socket.io 实时推送与协作更新
- 集成 AI 生成能力（通过 `@google/genai` API）

### 核心模块
- `src/components/Dashboard.tsx`: 案例列表与统计面板
- `src/components/Editor.tsx`: 案件详细编辑与预览
- `src/components/CanvasView.tsx`: 图形/流程布局展示
- `src/services/apiService.ts`: 与后端 REST API 的封装
- `src/services/pptxService.ts`: PPTX 导出实现
- `server.ts`: Express + Vite 统一后端 + 业务逻辑 + 代理

### 功能特性
1. 数据 CRUD：增删改查案件数据（仅 MySQL）
2. 实时更新：Socket.io 实现多人协作通知和页面刷新
3. PPT 导出：一键从案件数据生成 PPT 文件
4. 环境配置：支持 `GEMINI_API_KEY`、MySQL 连接配置
5. 部署方式：可直接 `npm run build` →  `nginx` 静态服务或 Docker 部署

## 本地运行
**前置条件：** Node.js、npm、MySQL

1. 安装依赖：
   `npm install`
2. 配置环境变量：
   - 复制 `.env.example` 为 `.env`
   - 填写必要项，如 `GEMINI_API_KEY`、MySQL 连接：
     ```text
     GEMINI_API_KEY=xxxx
     AUTH_SECRET=change-me-in-production
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=123456
     DB_NAME=OpenclawAppPlatform
     PORT=3010
     HOST=0.0.0.0
     ```
3. 启动开发：
   `npm run dev`
4. 浏览器访问：
   `http://localhost:3010`

## Docker 部署
1. 确认已配置好 `.env` 或直接使用 `docker-compose.yml` 中的默认值。
2. 启动服务：
   `docker compose up -d --build`
3. 浏览器访问：
   `http://localhost`

推荐使用一键部署脚本（包含迁移与健康检查）：
- `bash start.sh`

当前 Compose 链路为：
- `web`：Nginx 静态托管 + 反向代理
- `api`：Node/Express 服务，监听 `3010`
- `mysql-server`：MySQL 8.4，初始化数据库 `OpenclawAppPlatform`

## 数据库迁移手册

### 迁移原则
- `init.sql` 仅负责创建数据库和 `schema_migrations` 表。
- 业务表结构与增量变更统一由 `migrations/*.sql` 管理。
- API 启动时只校验 schema 版本，不再自动补表字段。

### 首次部署
1. 启动 MySQL：`docker compose up -d mysql-server`
2. 执行迁移：`docker compose run --rm --no-deps api npm run migrate`
3. 启动应用：`docker compose up -d --build api web`

### 增量发布
1. 拉取代码并构建前端：`npm install && npm run build`
2. 执行迁移：`docker compose run --rm --no-deps api npm run migrate`
3. 重启应用：`docker compose up -d --build api web`

### 回滚建议
- 代码回滚：切回上一个稳定版本后重新构建并重启容器。
- 数据回滚：优先使用 MySQL 备份恢复，不建议手工逆向改表。
- 若迁移失败，不要直接启动 API，先修复迁移脚本并重新执行 `npm run migrate`。

### 常见排障
- schema 版本不匹配：先执行 `npm run migrate`，再重启 API。
- 容器异常：`docker compose ps`
- API 日志：`docker logs openclaw-api --tail 150`
- Nginx 日志：`docker logs openclaw-nginx --tail 150`
- MySQL 日志：`docker logs mysql-server --tail 150`

## 验证与调试
- `npm run lint`：TypeScript 类型检查
- `npm run dev`：开发模式
- `curl http://localhost:3010/api/health`：检查 API 进程健康状态
- `curl http://localhost:3010/api/health/db`：检查数据库连接状态
- `docker logs openclaw-api --tail 100`：查看 API 启动日志
- `docker logs openclaw-nginx --tail 100`：查看 Nginx 代理日志
- `docker logs mysql-server --tail 100`：查看 MySQL 启动日志
- 说明：当前版本不再支持文件存储回退，MySQL 不可用时服务会启动失败。

## 目录结构
```text
├── src/
│   ├── components/
│   └── services/
├── server.ts
├── vite.config.ts
├── nginx.conf
└── package.json
```

---

如需进一步优化部署（例如 `server.ts` 监听 `PORT=3010`、`HOST=0.0.0.0`）请继续告知。