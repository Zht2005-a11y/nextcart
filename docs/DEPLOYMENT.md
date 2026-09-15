# NextCart 部署运维手册

> 面向学习者的完整部署与运维流程。跟着本手册做完，你将拥有：
> - 一个部署在 Vercel 上的在线 Demo
> - 一套 GitHub Actions CI/CD 流水线
> - 一份可复用的数据库迁移与回滚流程
> - 日常运维（日志、监控、备份、排障）的实操清单

---

## 0. 部署架构总览

```text
                          ┌──────────────────────────────┐
                          │           GitHub             │
                          │  main 分支 / Actions CI/CD   │
                          └──────┬───────────────┬───────┘
                     push / PR   │               │ 触发部署
                                 ▼               ▼
                    ┌──────────────────┐  ┌──────────────────┐
                    │   CI（Actions）   │  │ 迁移（Actions）    │
                    │ lint/build/test │  │ prisma migrate   │
                    └──────────────────┘  └────────┬─────────┘
                                                   │
                                                   ▼
        ┌────────────────────────────┐   ┌──────────────────┐
        │   Vercel（Serverless）      │   │  Supabase（Postgres）│
        │   Next.js 应用 / API 路由   │──▶│  业务表 / Auth     │
        │   边缘缓存 / HTTPS          │   └──────────────────┘
        └─────────────┬──────────────┘
                      │ Stripe Webhook 回调
                      ▼
        ┌────────────────────────────┐
        │   Stripe（测试模式）         │
        │   Checkout / 支付回调       │
        └────────────────────────────┘
```

**两条部署路径（二选一，建议先学 A 再学 B）**

| 路径 | 平台 | 适合 | 运维复杂度 |
| :--- | :--- | :--- | :--- |
| A. Serverless | Vercel + Supabase | 个人项目、简历 Demo、快速上线 | 低（平台托管） |
| B. 自托管 | Docker + VPS + Nginx | 学习传统运维、企业场景 | 高（自己管一切） |

---

## 1. 前置准备（账号清单）

| 服务 | 用途 | 免费额度 | 注册地址 |
| :--- | :--- | :--- | :--- |
| GitHub | 代码仓库 + CI/CD | 无限私有仓库 | github.com |
| Vercel | 前端托管 + Serverless | Hobby 计划免费 | vercel.com |
| Supabase | PostgreSQL + Auth | 500MB 数据库免费 | supabase.com |
| Stripe | 测试支付 | 测试模式免费 | stripe.com |

> 本手册所有步骤都用测试/免费额度完成，不会产生费用。

---

## 2. 本地到生产的环境变量

### 2.1 变量清单

| 变量 | 本地开发 | 生产 | 说明 |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `prisma+postgres://...`（prisma dev） | Supabase 连接串（pgbouncer） | 运行时连接 |
| `DIRECT_URL` | 同左（自动转换） | Supabase 直连串 | 仅迁移用 |
| `NEXT_PUBLIC_SUPABASE_URL` | 不填（本地模式） | `https://xxx.supabase.co` | 浏览器端可见 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 不填 | anon key | 浏览器端可见 |
| `SUPABASE_SERVICE_ROLE_KEY` | 不填 | service role key | ⚠️ 仅服务端 |
| `STRIPE_SECRET_KEY` | 不填（自动模拟支付） | `sk_test_...` | ⚠️ 仅服务端 |
| `STRIPE_WEBHOOK_SECRET` | 不填 | `whsec_...` | ⚠️ 仅服务端 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 不填 | `pk_test_...` | 浏览器端可见 |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://你的域名` | 支付回跳 |

### 2.2 安全原则（重点学习）

1. **`NEXT_PUBLIC_` 前缀 = 会进浏览器包**，只能放公开数据。
2. 没有前缀的变量只在服务端（Server Components / Server Actions / Route Handlers）可见。
3. **绝对不要把 `SUPABASE_SERVICE_ROLE_KEY`、`STRIPE_SECRET_KEY` 写进 `NEXT_PUBLIC_`**，否则等于把数据库管理员密码发给了所有人。
4. 密钥只存在于平台的环境变量面板 / `.env` 本地文件，**永不提交进 git**（`.gitignore` 已排除 `.env*`）。

---

## 3. 数据库部署（Supabase）

### 3.1 创建项目

1. 登录 Supabase → New Project → 填名称（如 `nextcart`）、设置数据库密码。
2. 记下项目 URL（`https://<project-ref>.supabase.co`）。
3. 左侧 **Project Settings → Database → Connection string**：
   - **URI** 模式：拿 `postgresql://...`（供 `DATABASE_URL`，加 `?pgbouncer=true&connection_limit=1`）
   - **Direct connection**：拿直连串（供 `DIRECT_URL`）

### 3.2 推送表结构（两种方式）

```bash
# 方式一：直接同步（本地开发常用，不生成迁移文件）
npx prisma db push

# 方式二：生成迁移文件并应用（生产推荐，可追踪、可回滚）
npx prisma migrate dev --name init   # 本地生成 SQL 迁移
npx prisma migrate deploy            # 对生产库应用
```

### 3.3 生产迁移的安全流程（核心运维知识）

```text
发布新版本时：
1. 先在 CI 跑 `prisma migrate deploy`（迁移先行）
2. 迁移成功后再部署新代码
3. 迁移 SQL 要兼容旧代码（如：加列时先允许 NULL，分两步走）

回滚时：
1. 回滚代码到上一个版本
2. 数据库一般不做"回滚迁移"，而是"新增一个反向迁移"修复
```

> ⚠️ 千万别在生产环境用 `prisma db push`（可能破坏数据）；生产只用 `prisma migrate deploy`。

---

## 4. 路径 A：部署到 Vercel（推荐先学）

### 4.1 推送代码到 GitHub

```bash
git add -A
git commit -m "feat: 完成 NextCart 全栈电商平台"
git branch -M main
git remote add origin https://github.com/<你的账号>/nextcart.git
git push -u origin main
```

### 4.2 在 Vercel 导入项目

1. 登录 vercel.com → **Add New → Project** → 选 GitHub 仓库 `nextcart`。
2. Framework Preset 会自动识别 **Next.js**。
3. 配置环境变量（逐项填入第 2.1 节"生产"列的值）。
4. Build Command 保持默认（`npm run build` 已含 `prisma generate`）。
5. 点击 **Deploy**，等 1-2 分钟，获得 `https://nextcart-xxx.vercel.app`。

### 4.3 配置 Supabase Auth 回调（如果用 Supabase Auth）

Supabase Dashboard → Authentication → URL Configuration：
- Site URL: `https://nextcart-xxx.vercel.app`
- Redirect URLs 添加：`https://nextcart-xxx.vercel.app/api/auth/callback`

### 4.4 配置 Stripe Webhook（让支付回调生效）

```bash
# 本地联调：Stripe CLI 把线上事件转发到本地
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# 会输出 whsec_...，填到本地 STRIPE_WEBHOOK_SECRET
```

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**。
2. Endpoint URL：`https://nextcart-xxx.vercel.app/api/webhooks/stripe`
3. 事件选择：`checkout.session.completed`
4. 把生成的 `whsec_...` 填入 Vercel 的 `STRIPE_WEBHOOK_SECRET`。

### 4.5 验证部署结果（检查清单）

- [ ] `https://nextcart-xxx.vercel.app/` 打开首页，商品列表可见
- [ ] 注册新用户 → 自动成为管理员（首个用户）→ 能进 `/admin`
- [ ] 用 Stripe 测试卡 `4242 4242 4242 4242` 完成一笔支付
- [ ] 订单状态：待付款 → 已付款（Webhook 生效）
- [ ] 管理员发货 → 用户确认收货 → 已完成

---

## 5. 路径 B：Docker 自托管（进阶运维）

### 5.1 本地构建镜像

```bash
npm run build && docker build -t nextcart .
```

### 5.2 部署到 VPS（以 Ubuntu + Nginx 为例）

```bash
# 1. 服务器上拉取代码并构建
git clone https://github.com/<账号>/nextcart.git && cd nextcart
cp .env.example .env.production   # 填入生产环境变量
docker build -t nextcart .

# 2. 运行容器（注意：数据库仍用 Supabase，或自建 Postgres）
docker run -d --name nextcart \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  nextcart

# 3. Nginx 反向代理 + HTTPS（certbot）
# server { listen 443 ssl; server_name your.domain.com;
#          location / { proxy_pass http://127.0.0.1:3000; } }
```

### 5.3 更新与回滚

```bash
# 更新
git pull && docker build -t nextcart . && docker rm -f nextcart && docker run -d ...

# 回滚（保留旧镜像 tag）
docker build -t nextcart:v1.2.3 .
docker run ... nextcart:v1.2.3
```

---

## 6. CI/CD 流水线（本仓库已配置）

| 文件 | 作用 |
| :--- | :--- |
| `.github/workflows/ci.yml` | 每次 push/PR 自动跑 lint + build + 单测 |
| `.github/workflows/deploy.yml` | main 推送 → 先迁移数据库 → 再部署 Vercel |

### 6.1 启用部署流水线需配置的 Secrets

GitHub 仓库 → **Settings → Secrets and variables → Actions**：

| Secret | 来源 |
| :--- | :--- |
| `DIRECT_URL` | Supabase 直连串（迁移用） |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel projects ls` 输出里的 org id |
| `VERCEL_PROJECT_ID` | `vercel link` 后 `vercel project ls` 输出 |

> 若用 Vercel 官方 GitHub Integration，可省略 deploy.yml 中的手动步骤（集成自动触发），两者选一。

---

## 7. 日常运维手册（Operations Runbook）

### 7.1 发布流程（标准动作序列）

```text
1. 从 main 拉新分支 feature/xxx
2. 开发 → 本地测试 → commit（Conventional Commits）
3. 提 PR → CI 自动跑（lint/build/test）→ 评审通过后合并
4. 合并到 main → deploy.yml 自动执行：迁移数据库 → 部署 Vercel
5. 在线上做冒烟验证（首页 / 商品 / 下单 / 后台）
```

### 7.2 日志查看

| 场景 | 命令 / 入口 |
| :--- | :--- |
| Vercel 函数日志 | Vercel Dashboard → 项目 → Logs |
| Docker 容器日志 | `docker logs -f nextcart` |
| 本地开发日志 | `dev-server.log` / 终端 |
| Prisma 查询日志 | 开发环境已开启 `['warn','error']` |

### 7.3 监控

| 维度 | 免费方案 |
| :--- | :--- |
| 可用性 | UptimeRobot（免费 50 个监控点） |
| 错误追踪 | Sentry（个人项目免费）→ 接入 `@sentry/nextjs` |
| 性能 | Vercel Analytics / Web Vitals |
| 数据库 | Supabase Dashboard → Database → Monitoring |

### 7.4 备份与恢复

- Supabase 自动每日备份（免费版保留 7 天），可在 Dashboard → Database → Backups 查看。
- 手动备份：`pg_dump --dbname="$DIRECT_URL" -f backup.sql`
- 恢复演练：用备份在新项目恢复，验证数据完整再删除。

### 7.5 常见故障排查（对照表）

| 症状 | 原因 | 处理 |
| :--- | :--- | :--- |
| 部署成功但首页 500 | `DATABASE_URL` 未配/配错 | 检查 Vercel 环境变量，看 Logs 报错 |
| 支付后订单未变"已付款" | Webhook 未配置/签名失败 | 检查 Stripe Webhook 端点与 `STRIPE_WEBHOOK_SECRET` |
| `prisma migrate deploy` 超时 | 用了连接池地址跑迁移 | 迁移必须用 `DIRECT_URL` |
| 登录后跳回登录页 | Supabase Auth URL 未配置回调 | 见 4.3 节 |
| 图片不显示 | 商品 images 是外部 URL | 换成 `/images/xxx.svg` 本地路径 |
| 本地 500 "driver adapter" | `prisma dev` 数据库没启动 | 运行 `npx prisma dev -d` 再 `npm run dev` |

### 7.6 安全清单（上线前逐项确认）

- [ ] 所有密钥都在环境变量面板，`.env` 已加入 `.gitignore`
- [ ] `NEXT_PUBLIC_` 前缀只用于公开变量
- [ ] Stripe 使用测试模式 key（`sk_test_`），上线真实收款再换 `sk_live_`
- [ ] 生产数据库用强密码，关闭公开访问（Supabase 默认需要 key）
- [ ] 管理员角色检查在服务端执行（`requireAdmin()`），不依赖前端隐藏

---

## 8. 学习作业（做完即掌握）

1. **动手部署路径 A**：完成 4.1–4.5，拿到在线 Demo 链接。
2. **写一份部署文档**：用自己的话复述 4.2 的 5 个步骤，标注每个环境变量的作用。
3. **演练迁移**：在 schema 里加一个字段（如 `Product.brand`），本地 `migrate dev` 生成迁移，推到生产 `migrate deploy`，观察迁移表 `_prisma_migrations`。
4. **模拟故障**：故意删掉 Vercel 的一个环境变量，观察部署后报错，练习看 Logs 定位。
5. **配置监控**：给域名加 UptimeRobot，配置一次失败告警邮件。
6. **练习回滚**：推送一个有意的坏提交，用 `git revert` 回滚，观察 CI 自动重部署。

---

## 9. 相关资源

- Next.js 部署文档：https://nextjs.org/docs/app/building-your-application/deploying
- Vercel 环境变量：https://vercel.com/docs/environment-variables
- Prisma 部署指南：https://www.prisma.io/docs/orm/prisma-client/deployment
- Supabase 备份：https://supabase.com/docs/guides/database/backups
- Stripe Webhook：https://docs.stripe.com/webhooks
- GitHub Actions 文档：https://docs.github.com/actions
