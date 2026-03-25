#!/bin/bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令: $1"
    exit 1
  fi
}

print_failure_hints() {
  echo
  echo "部署失败，可执行以下命令继续排查："
  echo "  docker compose ps"
  echo "  docker logs openclaw-api --tail 100"
  echo "  docker logs openclaw-nginx --tail 100"
  echo "  docker logs mysql-server --tail 100"
}

trap print_failure_hints ERR

require_cmd docker
require_cmd npm
require_cmd curl

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  log "未检测到 .env，自动从 .env.example 复制"
  cp ".env.example" ".env"
  echo "已生成 .env，请按需修改其中的生产配置后重新执行脚本。"
  exit 0
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [ "${SKIP_GIT_PULL:-false}" = "true" ]; then
    log "已跳过 git pull（SKIP_GIT_PULL=true）"
  else
    log "拉取最新代码"
    git pull --ff-only
  fi
fi

log "安装依赖"
npm install

log "构建前端产物"
npm run build

log "停止旧容器并清理孤儿容器"
docker compose down --remove-orphans

log "先启动 MySQL"
docker compose up -d mysql-server

log "等待 MySQL 健康检查通过"
for i in $(seq 1 30); do
  MYSQL_HEALTH=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' mysql-server 2>/dev/null || true)
  if [ "$MYSQL_HEALTH" = "healthy" ]; then
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "MySQL 健康检查超时"
    exit 1
  fi
done

log "执行数据库迁移"
docker compose run --rm --no-deps api npm run migrate

log "启动 API 和 Nginx"
docker compose up -d --build api web

log "等待 API 健康检查通过"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:3010/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "API 健康检查超时: /api/health"
    exit 1
  fi
done

log "等待数据库健康检查通过"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:3010/api/health/db" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "数据库健康检查超时: /api/health/db"
    exit 1
  fi
done

log "当前容器状态"
docker compose ps

log "部署完成"
echo "访问地址: http://localhost"