FROM node:20-slim AS development

WORKDIR /app

# 安装 pnpm 和 Prisma 依赖
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

# 先复制 package.json
COPY package*.json pnpm-workspace.yaml ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/

# 安装依赖
RUN pnpm install

# 复制源代码
COPY apps/api ./apps/api
COPY packages ./packages
COPY packages/database/prisma ./prisma

# 生成 Prisma Client
RUN pnpm --filter @career-assessment/database generate

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "dev"]

# 生产阶段
FROM node:20-slim AS production

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json pnpm-workspace.yaml ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

COPY apps/api ./apps/api
COPY packages ./packages
COPY packages/database/prisma ./prisma

RUN pnpm --filter @career-assessment/database generate
RUN pnpm --filter api build

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
