# 使用 Node 20 环境并利用 tsx 运行 TS
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 拷贝环境定义和依赖清单
COPY package.json package-lock.json* ./

# 设置 npm 镜像源加速安装依赖
RUN npm config set registry https://registry.npmmirror.com && npm install

# 拷贝所有源码
COPY . .

# 构建前端
RUN npm run build

# 安装生产依赖
RUN npm ci --production

# 暴露端口
EXPOSE 3010

# 启动 Node 核心服务
CMD ["npx", "tsx", "server.ts"]
