# 本地开发指南 - Docker Compose 方式

## 环境要求

- **macOS** (您的 MacBook Pro ✅)
- **Docker Desktop** (已安装 ✅)
- **pnpm** (通过 package.json 的 packageManager 字段管理)

## 快速开始

### 1. 首次启动（约需 3-5 分钟）

```bash
# 进入项目目录
cd /Users/tim/Programming/career-assessment-vue

# 启动所有服务（后台运行）
docker compose up -d

# 等待 MySQL 启动完成（约 30 秒）
docker compose logs -f mysql

# 当看到 "ready for connections" 时，按 Ctrl+C 退出日志查看
```

### 2. 初始化数据库

```bash
# 运行数据库迁移
docker compose exec api pnpm db:migrate

# 导入初始数据（31道题目 + 默认管理员）
docker compose exec api pnpm db:seed
```

### 3. 访问应用

- **前端界面**: http://localhost:5173
- **后端 API**: http://localhost:3000
- **API 文档**: http://localhost:3000/api/health

### 4. 默认账号

- **管理员密码**: `admin123`

## 日常开发命令

### 启动/停止服务

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f           # 所有服务
docker compose logs -f web       # 仅前端
docker compose logs -f api       # 仅后端
docker compose logs -f mysql     # 仅数据库
```

### 代码修改

**热重载已配置**：
- 修改 `apps/web/src/` 下的代码 → 前端自动刷新
- 修改 `apps/api/src/` 下的代码 → 后端自动重启

**注意**：修改 `package.json` 或安装新依赖需要重建容器：
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 数据库操作

```bash
# 运行迁移
docker compose exec api pnpm db:migrate

# 重置数据库（谨慎使用！）
docker compose down -v          # 删除数据卷
docker compose up -d mysql      # 重新启动 MySQL
docker compose exec api pnpm db:migrate
docker compose exec api pnpm db:seed

# 打开 Prisma Studio（数据库 GUI）
docker compose exec api pnpm db:studio
```

### 调试

```bash
# 进入容器查看

# 前端容器
docker compose exec web sh

# 后端容器
docker compose exec api sh

# MySQL 容器
docker compose exec mysql mysql -uappuser -papppassword career_assessment
```

## 端口说明

| 服务 | 端口 | 用途 |
|------|------|------|
| Web (前端) | 5173 | Vue 3 开发服务器 |
| API (后端) | 3000 | Express API 服务 |
| MySQL | 3306 | 数据库服务 |

## 常见问题

### 1. 端口冲突

如果 3306、3000 或 5173 端口被占用：

```bash
# 查看占用端口的进程
lsof -i :3306
lsof -i :3000
lsof -i :5173

# 停止占用端口的进程，或修改 compose.yml 中的端口映射
```

### 2. 权限问题

```bash
# 如果容器无法读取文件，修复权限
sudo chown -R $(id -u):$(id -g) .
```

### 3. 数据库连接失败

```bash
# 检查 MySQL 健康状态
docker compose ps

# 查看 MySQL 日志
docker compose logs mysql

# 重启 MySQL
docker compose restart mysql
```

### 4. 清理缓存重建

```bash
# 完全清理并重建
docker compose down -v
docker system prune -a
rm -rf node_modules apps/*/node_modules packages/*/node_modules
docker compose build --no-cache
docker compose up -d
```

## 项目结构（本地开发）

```
career-assessment/
├── apps/
│   ├── web/                 # 前端代码（热重载）
│   └── api/                 # 后端代码（热重载）
├── packages/
│   ├── database/            # 数据库配置和迁移
│   └── shared/              # 共享类型定义
├── compose.yml              # Docker Compose 配置
└── .env                     # 环境变量
```

## 生产环境部署

开发完成后，使用生产配置：

```bash
# 生产环境部署
docker compose -f compose.prod.yml up -d
```

## 技术支持

如遇到问题：
1. 查看 Docker Desktop 状态
2. 检查 `docker compose logs`
3. 确认端口未被占用
4. 尝试清理重建

---

**现在您可以开始开发测试了！** 🚀

建议先访问 http://localhost:5173 进行一次完整的测评流程测试。
