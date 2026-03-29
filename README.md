# 学生职场潜能测评系统

基于 Vue 3 + Express + MySQL 的全栈应用

## 🎯 功能特性

- 31道职场潜能测评题目
- 9个维度能力评估（沟通表达、团队协作、问题解决等）
- 管理员后台（题目配置、数据导出、邮件发送）
- 响应式设计（支持移动端/平板/桌面）
- PDF 报告生成
- Docker 一键部署

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (可选)

### 本地开发

```bash
# 1. 克隆项目
git clone <repository-url>
cd career-assessment

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 4. 启动数据库 (使用 Docker)
docker compose up -d mysql

# 5. 初始化数据库
pnpm db:migrate
pnpm db:seed

# 6. 启动开发服务器
pnpm dev
```

访问 http://localhost:5173

### Docker 一键部署

```bash
# 开发环境
docker compose up -d

# 生产环境
docker compose -f compose.prod.yml up -d
```

## 📁 项目结构

```
career-assessment/
├── apps/
│   ├── web/                 # Vue 3 前端
│   │   ├── src/
│   │   │   ├── api/         # API 客户端
│   │   │   ├── components/  # 组件
│   │   │   ├── router/      # 路由配置
│   │   │   ├── stores/      # Pinia 状态管理
│   │   │   └── views/       # 页面视图
│   │   └── package.json
│   └── api/                 # Express 后端
│       ├── src/
│       │   ├── routes/      # API 路由
│       │   ├── middleware/  # 中间件
│       │   └── index.ts     # 入口文件
│       └── package.json
├── packages/
│   ├── database/            # Prisma 数据库配置
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── shared/              # 共享类型定义
│       └── src/
│           └── index.ts
├── compose.yml
├── compose.prod.yml
└── package.json
```

## 🔧 常用命令

```bash
# 开发
pnpm dev              # 启动所有服务
pnpm dev:web          # 仅启动前端
pnpm dev:api          # 仅启动后端

# 数据库
pnpm db:generate      # 生成 Prisma Client
pnpm db:migrate       # 运行数据库迁移
pnpm db:seed          # 导入初始数据
pnpm db:studio        # 打开 Prisma Studio

# 构建
pnpm build            # 构建所有应用
pnpm build:web        # 仅构建前端
pnpm build:api        # 仅构建后端

# 代码质量
pnpm lint             # 运行 ESLint
pnpm typecheck        # 运行 TypeScript 类型检查

# Docker
pnpm docker:up        # 启动 Docker 容器
pnpm docker:down      # 停止 Docker 容器
pnpm docker:build     # 构建 Docker 镜像
```

## 🔐 默认账号

- 管理员密码: `admin123`
- 首次登录后建议立即修改密码

## 📊 数据库模型

主要实体:
- **User**: 测评用户信息
- **Assessment**: 测评记录
- **Question**: 测评题目
- **Option**: 题目选项
- **Admin**: 管理员配置
- **EmailQueue**: 邮件队列

## 🛠️ 技术栈

### 前端
- Vue 3 + Composition API
- TypeScript
- Vite
- Pinia
- Vue Router
- Tailwind CSS
- Chart.js
- jsPDF + html2canvas

### 后端
- Express
- TypeScript
- Prisma ORM
- MySQL
- JWT 认证
- Zod 验证

## 📄 许可证

MIT
