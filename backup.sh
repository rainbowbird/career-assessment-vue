#!/bin/bash
#
# Career Assessment System - 数据备份脚本
# 使用方法: ./backup.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="./data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# 加载环境变量
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "🔄 开始备份数据..."

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 执行数据库备份
echo "📦 备份 MySQL 数据库..."
docker compose -f compose.prod.yml exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} career_assessment > ${BACKUP_DIR}/${BACKUP_FILE}

# 压缩备份文件
echo "🗜️  压缩备份文件..."
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# 清理旧备份（保留最近30天的备份）
echo "🧹 清理旧备份文件..."
find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +30 -delete

# 显示备份信息
echo -e "${GREEN}✅ 备份完成！${NC}"
echo "📁 备份文件: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
echo "📊 文件大小: $(du -h ${BACKUP_DIR}/${BACKUP_FILE}.gz | cut -f1)"

# 列出最近5个备份
echo ""
echo "📋 最近的备份文件:"
ls -lt ${BACKUP_DIR}/*.gz 2>/dev/null | head -5 || echo "暂无备份文件"
