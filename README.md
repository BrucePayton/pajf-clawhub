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
**前置条件：** Node.js、npm

1. 安装依赖：
   `npm install`
2. 配置环境变量：
   - 在项目根目录创建 `.env`（或 `.env.local`）
   - 添加必要项，如 `GEMINI_API_KEY`、MySQL 连接：
     ```text
     GEMINI_API_KEY=xxxx
     MYSQL_HOST=localhost
     MYSQL_PORT=3306
     MYSQL_USER=root
     MYSQL_PASS=123456
     MYSQL_DB=cases
     ```
3. 启动开发：`npm run dev`
4. 浏览器访问：`http://localhost:3010`

## 生产构建
1. 执行：`npm run build`
2. 启动静态服务（示例使用 nginx）：
   - 修改 `nginx.conf` 使 `root` 指向 `dist`
   - `docker run -d --name openclaw-nginx -p 8080:80 -v $(pwd)/dist:/usr/share/nginx/html:ro -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro --restart always nginx:latest`
3. 访问：`http://localhost:8080`

## 验证与调试
- `npm run lint`：ts 类型检查
- `npm run dev`：开发模式（watch + vite）
- `docker logs openclaw-nginx --tail 50`：查看 nginx 代理日志
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