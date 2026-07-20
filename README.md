# 小账本

移动端优先的简易记账 Web 项目，技术栈为 Next.js、antd-mobile、Prisma 和 PostgreSQL。

## 本地运行

项目默认连接 `photo-dev-db` 容器中的独立 `jizhang` 数据库：

```text
postgresql://postgres:postgres@localhost:6000/jizhang
```

如果本机容器配置不同，请复制 `.env.example` 为 `.env` 并修改 `DATABASE_URL`。

```bash
npm install
npm run prisma:generate
npx prisma migrate dev --name init
npm run dev
```

打开 <http://localhost:3000>，注册账号后即可使用。

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
npm test
npm run build
```
