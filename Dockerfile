# ============================================
# Stage 1: 安装依赖
# ============================================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --prod --frozen-lockfile

# ============================================
# Stage 2: 构建
# ============================================
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ============================================
# Stage 3: 生产运行
# ============================================
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma 运行时需要
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 8001

ENV PORT=8001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
