# 使用 Node 20 环境并利用 tsx 运行 TS
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 拷贝环境定义和依赖清单
COPY package.json package-lock.json* ./

# 设置 npm 镜像源加速安装依赖（如不需要可删除）
RUN npm config set registry https://registry.npmmirror.com && npm ci --omit=dev || npm install --production

# 拷贝核心服务器源码
COPY server.ts ./
# 拷贝 tsconfig (以便于 tsx / tsc 运行)
COPY tsconfig.json ./

# 拷贝数据目录占位
COPY data/ ./data/

# 暴露端口
EXPOSE 3010

# 启动 Node 核心服务 (为了兼容非 Node 23 版本，回退到 tsx)
CMD ["npx", "tsx", "server.ts"]
