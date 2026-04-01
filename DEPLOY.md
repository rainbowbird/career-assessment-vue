# Career Assessment System - 云主机一键部署指南

> 📚 **相关文档**：[README.md](README.md) | [本地开发指南](LOCAL_DEV_GUIDE.md) | [代理配置指南](AGENTS.md)

## 🚀 快速开始

### 1. 准备云主机

推荐配置：
- **CPU**: 2 核或以上
- **内存**: 4GB 或以上
- **磁盘**: 50GB SSD
- **操作系统**: Ubuntu 22.04 LTS / CentOS 8 / Debian 11
- **网络**: 开放 80 (HTTP) 和 443 (HTTPS) 端口

### 2. 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

### 3. 下载项目

```bash
# 方式1：从 Git 克隆
git clone https://github.com/your-repo/career-assessment-vue.git
cd career-assessment-vue

# 方式2：上传压缩包到云主机
# unzip career-assessment-vue.zip
# cd career-assessment-vue
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
nano .env
```

**必须修改的配置项：**

```bash
# 数据库密码（请设置强密码）
MYSQL_ROOT_PASSWORD=your_strong_password_here
DB_PASSWORD=your_app_password_here

# JWT 密钥（请设置随机字符串）
JWT_SECRET=your_random_jwt_secret_key_here

# 域名（如果有的话）
DOMAIN=your-domain.com
```

### 5. 一键部署

```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

部署脚本会自动完成：
- ✅ 构建 Docker 镜像
- ✅ 启动所有服务
- ✅ 运行数据库迁移
- ✅ 生成 Prisma Client
- ✅ 健康检查

### 6. 访问应用

部署完成后，在浏览器中访问：
- **Web 应用**: http://your-server-ip
- **管理员后台**: http://your-server-ip/admin/login
- **默认密码**: `admin123`

## 🔧 常用命令

```bash
# 查看运行状态
docker compose -f compose.prod.yml ps

# 查看日志
docker compose -f compose.prod.yml logs -f

# 重启服务
docker compose -f compose.prod.yml restart

# 停止服务
docker compose -f compose.prod.yml down

# 更新部署（拉取代码后）
./deploy.sh

# 备份数据
./backup.sh
```

## 💾 数据备份

### 手动备份

```bash
# 运行备份脚本（自动压缩并清理旧备份）
./backup.sh
```

备份脚本会自动：
- 导出 MySQL 数据库
- 压缩备份文件（.gz 格式）
- 清理 30 天前的旧备份
- 显示备份文件大小

### 自动备份（推荐）

设置定时任务，每天自动备份：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 2 点备份）
0 2 * * * cd /path/to/career-assessment-vue && ./backup.sh >> ./data/logs/backup.log 2>&1
```

### 恢复备份

```bash
# 解压备份文件
gunzip ./data/backups/backup_20240101_120000.sql.gz

# 恢复数据库
docker compose -f compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} career_assessment < ./data/backups/backup_20240101_120000.sql
```

## 🔐 配置 HTTPS (SSL)

### 方式1：使用 Let's Encrypt (推荐)

```bash
# 安装 certbot
certbot certonly --standalone -d your-domain.com

# 复制证书
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./data/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./data/ssl/key.pem

# 重启 nginx
docker compose -f compose.prod.yml restart nginx
```

### 方式2：使用自签名证书

```bash
mkdir -p data/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout data/ssl/key.pem \
  -out data/ssl/cert.pem \
  -subj "/CN=your-domain.com"
```

## ⚙️ 配置 SMTP 邮件服务

1. 登录管理员后台
2. 进入"系统配置"页面
3. 配置 SMTP 服务器信息：
   - **SMTP 主机**: smtp.example.com
   - **SMTP 端口**: 587 (或 465)
   - **安全连接**: 是 (SSL/TLS)
   - **用户名**: your-email@example.com
   - **密码**: your-password

4. 点击"测试连接"验证配置
5. 保存配置

## 📝 注意事项

1. **安全建议**
   - 生产环境务必修改默认管理员密码
   - 使用强密码保护数据库
   - 配置 HTTPS 加密传输
   - 定期备份数据

2. **性能优化**
   - 建议启用 CDN 加速静态资源
   - 配置数据库索引优化查询
   - 使用 Redis 缓存（可选）

3. **监控建议**
   - 配置日志轮转防止磁盘占满
   - 设置数据库自动备份
   - 监控服务器资源使用情况

## 🐛 故障排查

### 问题1：部署失败，端口被占用

```bash
# 检查端口占用
sudo netstat -tlnp | grep :80

# 停止占用端口的进程
sudo systemctl stop apache2  # 如果使用 Apache
sudo systemctl stop nginx     # 如果使用 Nginx
```

### 问题2：数据库连接失败

```bash
# 查看数据库日志
docker compose -f compose.prod.yml logs mysql

# 重置数据库（会丢失数据，谨慎操作）
docker compose -f compose.prod.yml down -v
docker compose -f compose.prod.yml up -d
```

### 问题3：前端无法访问 API

```bash
# 检查 API 服务状态
docker compose -f compose.prod.yml logs api

# 重启 API 服务
docker compose -f compose.prod.yml restart api
```

## 📞 技术支持

如有问题，请查看：
- 📚 项目文档：[README.md](README.md)
- 🐛 提交 Issue: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 联系开发者

---

**祝您部署顺利！** 🎉
