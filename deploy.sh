# 生产环境部署脚本
# 使用方法: ./deploy.sh

#!/bin/bash

set -e

echo "🚀 开始部署 Career Assessment System..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 和 Docker Compose
echo "📦 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，从 .env.example 创建...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  请编辑 .env 文件，配置您的环境变量后再运行此脚本${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.example 文件也不存在${NC}"
        exit 1
    fi
fi

# 加载环境变量
export $(grep -v '^#' .env | xargs)

echo "🔧 环境检查完成"
echo "📍 部署域名: ${DOMAIN:-localhost}"
echo "🗄️  数据库: MySQL"
echo ""

# 创建必要的目录
echo "📁 创建数据目录..."
mkdir -p ./data/mysql
mkdir -p ./data/logs
mkdir -p ./data/backups

# 设置目录权限
chmod -R 755 ./data

echo "🔨 构建应用..."
docker compose -f compose.prod.yml build --no-cache

echo "🚀 启动服务..."
docker compose -f compose.prod.yml up -d

echo "⏳ 等待数据库启动..."
sleep 10

# 检查数据库连接
echo "🔍 检查数据库状态..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose -f compose.prod.yml exec -T mysql mysqladmin ping -u root -p${MYSQL_ROOT_PASSWORD} --silent &> /dev/null; then
        echo -e "${GREEN}✅ 数据库连接成功${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ 等待数据库就绪... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ 数据库启动失败${NC}"
    echo "查看日志: docker compose -f compose.prod.yml logs mysql"
    exit 1
fi

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
docker compose -f compose.prod.yml exec -T api npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma || true

# 生成 Prisma Client
echo "📦 生成 Prisma Client..."
docker compose -f compose.prod.yml exec -T api npx prisma generate --schema=/app/packages/database/prisma/schema.prisma

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "📱 应用访问地址:"
echo "   - Web 应用: http://${DOMAIN:-localhost}"
echo "   - API 接口: http://${DOMAIN:-localhost}/api"
echo ""
echo "🔐 管理员登录:"
echo "   - 访问: http://${DOMAIN:-localhost}/admin/login"
echo "   - 密码: admin123"
echo ""
echo "📊 常用命令:"
echo "   - 查看日志: docker compose -f compose.prod.yml logs -f"
echo "   - 停止服务: docker compose -f compose.prod.yml down"
echo "   - 重启服务: docker compose -f compose.prod.yml restart"
echo "   - 备份数据: ./backup.sh"
echo ""
echo -e "${YELLOW}⚠️  请在浏览器中访问应用，确保一切正常${NC}"
