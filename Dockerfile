# ============================================
# Stage 1: 构建
# ============================================
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN npx prisma generate
# pnpm 将 Prisma runtime 放在虚拟 store 中，复制到稳定路径供运行时镜像使用
RUN mkdir -p node_modules/.prisma && \
    cp -R node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/. node_modules/.prisma/

COPY . .
RUN pnpm run build

# 仅保留生产依赖
RUN pnpm prune --prod

# ============================================
# Stage 2: 生产运行
# ============================================
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma 运行时需要
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 8001

ENV PORT=8001
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
