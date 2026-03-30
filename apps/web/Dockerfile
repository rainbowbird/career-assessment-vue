FROM node:20-alpine AS development

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制配置文件
COPY package*.json pnpm-workspace.yaml ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# 安装依赖
RUN pnpm install

# 复制源代码
COPY apps/web ./apps/web
COPY packages ./packages

EXPOSE 5173

CMD ["pnpm", "--filter", "web", "dev"]

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json pnpm-workspace.yaml ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY packages ./packages

RUN pnpm --filter web build

FROM nginx:alpine

COPY --from=production /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
