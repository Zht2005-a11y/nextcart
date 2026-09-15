# NextCart

Full-Stack E-Commerce Platform — 全栈电商平台（个人学习项目）。

技术栈：React 19 · Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL (Supabase) · Supabase Auth · Zustand · Stripe · Zod · Vitest · Playwright

## 功能特性

- 商城：首页 / 商品列表（分类筛选、搜索）/ 商品详情 / 购物车 / 结算
- 订单：库存并发扣减（防超卖）/ 订单状态机 / 接口幂等 / 状态流转日志
- 支付：Stripe 测试支付 + Webhook 回调（未配置时自动本地模拟支付）
- 后台：仪表盘 / 商品管理（增删改、分类）/ 订单管理（发货、退款审批）
- 认证：注册 / 登录 / 角色权限（首个注册用户为管理员；支持 Supabase Auth）

## 快速开始（本地开发）

```bash
# 1. 安装依赖
npm install

# 2. 启动本地数据库（Prisma Postgres，若尚未运行）
npx prisma dev -d

# 3. 推送表结构并填充种子数据
npx prisma db push
npx prisma db seed

# 4. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 查看项目。

> 本地开发模式不需要 Supabase/Stripe：首个注册用户自动成为管理员，
> 下单后走"模拟支付"，无需任何外部账号即可体验完整流程。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建（含 prisma generate） |
| `npm run start` | 运行生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 单元测试 (Vitest) |
| `npm run test:e2e` | E2E 测试 (Playwright) |
| `npm run db:migrate` | 对生产库应用迁移 |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:studio` | 数据库可视化管理 |

## 部署与运维

完整部署运维手册见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)，覆盖：

- 路径 A：Vercel + Supabase（Serverless，推荐入门）
- 路径 B：Docker + VPS（自托管，进阶运维）
- GitHub Actions CI/CD 流水线（`.github/workflows/`）
- 日常运维：日志 / 监控 / 备份 / 回滚 / 排障清单

## 目录结构

- `app/(shop)/` — 用户端商城页面
- `app/(admin)/admin/` — 管理员后台页面
- `app/api/` — Route Handlers（OAuth 回调、Stripe Webhook）
- `actions/` — Server Actions（认证、购物车、订单、商品、后台）
- `lib/` — Prisma / Supabase / Stripe 客户端、权限校验、Zod 校验
- `store/` — Zustand 客户端状态（购物车）
- `prisma/` — 数据库模型、种子数据
- `middleware.ts` — 会话刷新与路由保护
- `docs/` — 开发文档与部署运维手册
