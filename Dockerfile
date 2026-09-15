# ============================================================
# NextCart Docker 镜像（自托管 / VPS 部署路径）
# 多阶段构建：依赖层 → 构建层 → 运行层
#
# 构建：
#   docker build -t nextcart .
# 运行（示例）：
#   docker run -p 3000:3000 --env-file .env.production nextcart
# ============================================================

# ---------- 阶段 1：依赖 ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 阶段 2：构建 ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 构建需要 Prisma Client；生产库连接在运行时注入
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate \
    && npm run build

# ---------- 阶段 3：运行 ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 只拷贝运行所需的最小文件集（运维最佳实践：减小攻击面）
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/lib/generated ./lib/generated
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
