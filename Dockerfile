# 使用 Node 20 环境运行统一服务
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

# 暴露端口
EXPOSE 3010

# 保留已安装依赖，避免运行时因裁剪 devDependencies 导致 tsx 缺失
CMD ["npx", "tsx", "server.ts"]
