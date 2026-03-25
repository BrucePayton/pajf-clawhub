#!/bin/bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

container_health() {
  docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$1" 2>/dev/null || echo "unknown"
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

dump_container_logs() {
  local name="$1"
  local lines="${2:-40}"
  echo "────── ${name} 最近 ${lines} 行日志 ──────"
  docker logs "$name" --tail "$lines" 2>&1 || true
  echo "──────────────────────────────────────"
}

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

# ── 构建 API 镜像（先于迁移，确保迁移使用最新代码） ──
log "构建 API Docker 镜像"
docker compose build --no-cache api

log "停止旧容器并清理孤儿容器"
docker compose down --remove-orphans

log "先启动 MySQL"
docker compose up -d mysql-server

log "等待 MySQL 就绪（健康检查或连通性检测）"
for i in $(seq 1 90); do
  MYSQL_HEALTH="$(container_health mysql-server)"
  if [ "$MYSQL_HEALTH" = "healthy" ]; then
    break
  fi
  if docker compose exec -T mysql-server sh -lc 'mysqladmin ping -h 127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD" --silent' >/dev/null 2>&1; then
    break
  fi
  if [ $((i % 10)) -eq 0 ]; then
    log "MySQL 等待中（状态: ${MYSQL_HEALTH:-unknown}，已等待 $((i * 2))s）"
  fi
  sleep 2
  if [ "$i" -eq 90 ]; then
    log "MySQL 就绪检查超时（>180s）"
    dump_container_logs mysql-server 60
    exit 1
  fi
done

# ── 迁移使用已构建好的最新镜像，无需再次 --build ──
log "执行数据库迁移"
docker compose run --rm --no-deps api npm run migrate

# ── 启动服务（镜像已构建，不再重复 build） ──
log "启动 API 和 Nginx"
docker compose up -d api web

log "等待 API 健康检查通过（使用 Docker 容器健康状态，不受宿主机代理影响）"
API_OK=false
for i in $(seq 1 60); do
  API_HEALTH="$(container_health openclaw-api)"
  if [ "$API_HEALTH" = "healthy" ]; then
    API_OK=true
    break
  fi
  if docker compose exec -T api wget -q -O /dev/null http://127.0.0.1:3010/api/health 2>/dev/null; then
    API_OK=true
    break
  fi
  if [ $((i % 10)) -eq 0 ]; then
    log "API 等待中（容器状态: ${API_HEALTH}，已等待 $((i * 2))s）"
  fi
  sleep 2
done
if [ "$API_OK" != "true" ]; then
  log "API 健康检查超时"
  log "正在收集诊断信息..."
  docker compose ps
  dump_container_logs openclaw-api 80
  dump_container_logs mysql-server 30
  exit 1
fi

log "等待数据库健康检查通过"
DB_OK=false
for i in $(seq 1 30); do
  if docker compose exec -T api wget -q -O - http://127.0.0.1:3010/api/health/db 2>/dev/null | grep -q '"status":"ok"'; then
    DB_OK=true
    break
  fi
  if [ $((i % 10)) -eq 0 ]; then
    log "DB Health 等待中（已等待 $((i * 2))s）"
  fi
  sleep 2
done
if [ "$DB_OK" != "true" ]; then
  log "数据库健康检查超时: /api/health/db"
  dump_container_logs openclaw-api 40
  exit 1
fi

log "当前容器状态"
docker compose ps

log "部署完成"
echo ""
echo "  ➜  本机访问:   http://localhost"
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$LAN_IP" ] && LAN_IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -n "$LAN_IP" ]; then
  echo "  ➜  局域网访问: http://${LAN_IP}"
fi
echo ""