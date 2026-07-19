# 简易记账 Web 项目设计

## 目标

使用 Next.js、antd-mobile 和 PostgreSQL 构建一个移动端优先、兼容 PC 访问的简易记账 Web 项目。用户可以注册、登录，并维护自己的日期与金额账目。

## 已确认范围

- 首页采用“汇总卡片优先”布局。
- 支持注册、登录、退出登录。
- 每个用户只能查看和编辑自己的账目。
- 默认筛选当前自然月。
- 金额只允许非负数，最多两位小数。
- 数据库使用 `photo-dev-db` 容器中的 PostgreSQL。
- 用户名和密码按要求暂以明文保存，仅适合本地或内部演示；真实环境应改为密码哈希。

## 架构

- Next.js App Router 负责页面和服务端 Route Handlers。
- antd-mobile 提供移动端表单、弹框、日期选择、Toast、空状态和加载状态。
- Prisma 负责 PostgreSQL schema 与查询。
- 服务端使用密码学安全随机数生成器（CSPRNG）生成至少 128 位熵的会话 token，客户端不能自行构造或签发 token；服务端在 `Session` 表保存 token、用户 ID 和过期时间，并进行服务端查表校验，且必须拒绝 `expiresAt <= now` 的过期会话。HttpOnly Cookie 只保存 token，设置 `HttpOnly`、`SameSite=Lax`，生产环境设置 `Secure`，默认有效期 7 天。

页面：

- `/login`：登录
- `/register`：注册
- `/`：账目首页

接口：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/entries?startDate&endDate`
- `POST /api/entries`
- `PUT /api/entries/:id`

账目查询参数缺失时，服务端默认使用当前自然月；`startDate` 与 `endDate` 均为包含边界，且要求 `startDate <= endDate`。

## 数据模型

```text
User
  id          String   @id @default(cuid())
  username    String   @unique
  password    String
  createdAt   DateTime @default(now())
  entries     Entry[]
  sessions    Session[]

Session
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String
  expiresAt   DateTime
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

Entry
  id          String   @id @default(cuid())
  userId      String
  entryDate   DateTime @db.Date
  amountCent  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
```

金额以整数分存储：`12.34` 保存为 `1234`，避免 JavaScript 二进制浮点计算误差。接口使用严格金额字符串（正则 `^\\d+(\\.\\d{1,2})?$`），拒绝空字符串、负数、指数写法和超过 `21474836.47` 的金额；服务端不使用浮点转换，直接按字符串拆分并计算分，数据库增加 `amountCent >= 0` 约束。汇总使用整数分计算，响应时格式化为两位小数。

日期按 `YYYY-MM-DD` 作为纯日历日期解析和传输，不直接使用带时区的 JavaScript `Date` 做日期偏移转换；数据库查询使用日期边界的包含比较。

## 页面交互

首页顶部显示应用名称和退出入口；主区域先展示日期范围筛选和汇总卡片，再展示新增按钮与列表。列表列为日期、金额、编辑。新增和编辑共用一个弹框表单，字段为日期和金额，编辑时回填当前行数据。

移动端使用单列布局、较大的触控目标和安全区间距；PC 端将内容限制在合适的最大宽度并居中展示。

## 校验与错误处理

- 用户名不能为空且不可重复。
- 密码和确认密码必须一致。
- 日期必须存在并统一为 `YYYY-MM-DD`。
- 金额必须大于等于 0，最多两位小数。
- 未登录请求返回 401，前端跳转登录页。
- 查询使用 `WHERE userId = currentUserId`；编辑使用 `WHERE id = entryId AND userId = currentUserId`，访问他人记录统一返回 404，不泄露记录是否存在。
- 接口错误统一返回 `{ message }`，页面使用 Toast 提示。
- 加载状态显示 loading，无数据显示空状态。

## 测试与验证

- 金额元/分转换、两位小数校验。
- 当前自然月默认范围、日期范围过滤和汇总。
- 注册、登录、登出和会话鉴权。
- 新增、编辑以及用户数据隔离。
- 使用 `.env` 中的 `DATABASE_URL` 连接 `photo-dev-db`，提供 `.env.example`；执行 `prisma migrate dev` 创建迁移，生产/验证使用 `prisma migrate deploy`。数据库不可用时，测试与构建仍可执行，但数据库集成验收标记为未完成。
