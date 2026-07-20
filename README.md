# 小账本

移动端优先的简易记账 Web 项目，技术栈为 Next.js、antd-mobile、Prisma 和 PostgreSQL。

## 本地运行

项目默认连接 `photo-dev-db` 容器中的独立 `jizhang` 数据库：

```text
postgresql://postgres:postgres@localhost:6000/jizhang
```

如果本机容器配置不同，请复制 `.env.example` 为 `.env` 并修改 `DATABASE_URL`。

```bash
pnpm install
pnpm prisma:generate
npx prisma migrate dev --name init
pnpm dev
```

打开 <http://localhost:8001>，注册账号后即可使用。

## 功能

- 注册、登录、退出登录
- 每个账号独立的账目数据
- 默认查询当前自然月
- 日期范围筛选与金额汇总
- 新增、编辑账目
- 金额以整数分存储，避免浮点计算误差

> 当前按需求将用户名和密码明文存储，仅适合本地或内部演示。正式环境应改为密码哈希，并配置 HTTPS。

## 验证

```bash
pnpm test
pnpm build
```

## Docker 部署

```bash
# 构建并启动
docker compose up -d

# 或者手动构建运行
docker build -t jizhang .
docker run -d -p 8001:8001 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:6000/jizhang?schema=public" \
  --name jizhang jizhang
```

> 容器内通过 `host.docker.internal` 访问宿主机 PostgreSQL。如数据库不在本机，请修改 `DATABASE_URL`。
>
> 容器启动时会自动执行 `prisma migrate deploy` 创建或更新数据库表结构，无需手动迁移。
>
> 如果注册接口返回失败，请检查 PostgreSQL 是否在运行，以及 `DATABASE_URL` 连接信息是否正确。
