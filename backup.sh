#!/bin/bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

MYSQL_SERVICE="${MYSQL_SERVICE:-mysql-server}"
DB_NAME="${DB_NAME:-OpenclawAppPlatform}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-123456}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令: $1"
    exit 1
  fi
}

wait_mysql_ready() {
  log "检查 MySQL 可用性"
  for i in $(seq 1 45); do
    if docker compose exec -T "$MYSQL_SERVICE" sh -lc "mysqladmin ping -h 127.0.0.1 -u\"$DB_USER\" -p\"$DB_PASSWORD\" --silent" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
    if [ "$i" -eq 45 ]; then
      echo "MySQL 未就绪，备份终止。"
      return 1
    fi
  done
}

require_cmd docker
require_cmd tar

mkdir -p "$BACKUP_DIR"
TS="$(date '+%Y%m%d_%H%M%S')"
SQL_FILE="$BACKUP_DIR/${DB_NAME}_${TS}.sql"
DATA_FILE="$BACKUP_DIR/mysql_data_${TS}.tgz"

log "确保 MySQL 服务已启动"
docker compose up -d "$MYSQL_SERVICE" >/dev/null
wait_mysql_ready

log "导出数据库到 $SQL_FILE"
docker compose exec -T \
  -e MYSQL_PWD="$DB_PASSWORD" \
  "$MYSQL_SERVICE" \
  mysqldump \
    -u"$DB_USER" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    "$DB_NAME" > "$SQL_FILE"

if [ -d "$ROOT_DIR/mysql_data" ]; then
  log "检测到旧目录挂载 mysql_data，生成物理备份 $DATA_FILE"
  tar -czf "$DATA_FILE" -C "$ROOT_DIR" mysql_data
else
  log "未检测到 ./mysql_data，跳过物理目录备份"
fi

log "备份完成"
echo "SQL 备份: $SQL_FILE"
if [ -f "$DATA_FILE" ]; then
  echo "目录备份: $DATA_FILE"
fi
