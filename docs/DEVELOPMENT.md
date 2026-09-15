以下是一份可直接放入 `docs/DEVELOPMENT.md` 的 **NextCart 开发文档**。内容覆盖从环境搭建到部署、测试、面试准备的完整流程。

---

# NextCart 开发文档

> **项目名称**：NextCart — Full-Stack E-Commerce Platform  
> **版本**：1.0  
> **日期**：2026-09-13  
> **技术栈**：React 19 + Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + Prisma + PostgreSQL + Supabase + Stripe + Vercel  
> **目标**：通过一个生产级全栈电商项目，掌握主流技术栈，积累可写进简历、可被面试官深挖的工程经验。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术选型](#2-技术选型)
3. [系统架构](#3-系统架构)
4. [目录结构](#4-目录结构)
5. [环境搭建](#5-环境搭建)
6. [数据库设计](#6-数据库设计)
7. [认证与权限](#7-认证与权限)
8. [路由与页面设计](#8-路由与页面设计)
9. [核心模块开发](#9-核心模块开发)
10. [支付集成](#10-支付集成)
11. [AI 模块（可选）](#11-ai-模块可选)
12. [测试策略](#12-测试策略)
13. [部署方案](#13-部署方案)
14. [开发计划](#14-开发计划)
15. [代码规范与 Git 工作流](#15-代码规范与-git-工作流)
16. [简历与面试要点](#16-简历与面试要点)
17. [附录](#17-附录)

---

## 1. 项目概述

NextCart 是一个全栈电商平台，包含用户端商城与管理员后台。项目重点不是简单 CRUD，而是解决真实电商场景中的：

- **库存并发扣减**：防止超卖
- **订单状态机**：集中管理状态流转
- **接口幂等**：防止重复下单与重复支付回调
- **支付集成**：Stripe 测试支付完整闭环
- **权限控制**：用户与管理员角色分离
- **AI 增强**：商品描述生成或智能推荐（可选）

项目完成后你将拥有：

- 一个部署在 Vercel 上的在线 Demo
- 一份结构清晰的 GitHub 仓库
- 可讲述 30 分钟以上的技术设计决策
- 覆盖初级全栈工程师岗位核心考察点的项目经历

---

## 2. 技术选型

| 层级     | 技术                                      | 说明                     |
| :----- | :-------------------------------------- | :--------------------- |
| 前端框架   | React 19 + Next.js 15 App Router        | 全栈 React 事实标准          |
| 编程语言   | TypeScript                              | 类型安全，岗位标配              |
| 样式     | Tailwind CSS + shadcn/ui                | 开发速度快，组件可复制            |
| 后端     | Next.js Server Actions / Route Handlers | 同一框架内完成后端逻辑            |
| 数据库    | PostgreSQL（Supabase 托管）                 | 功能强大的开源关系型数据库          |
| ORM    | Prisma                                  | 类型安全，与 TypeScript 无缝集成 |
| 认证     | Supabase Auth                           | 注册、登录、会话管理             |
| 状态管理   | Zustand                                 | 轻量，适合购物车等客户端状态         |
| 支付     | Stripe 测试模式                             | 模拟真实支付流程               |
| AI（可选） | OpenAI API                              | 商品描述生成、推荐、智能客服         |
| 部署     | Vercel + Supabase                       | 一键部署，免费额度足够个人项目        |
| 校验     | Zod                                     | 表单与 API 输入校验           |
| 测试     | Vitest + Playwright                     | 单元测试与 E2E 测试           |

---

## 3. 系统架构

```text
┌─────────────────────────────────────────────────────────┐
│                      客户端（浏览器）                      │
│  React 19 + Next.js 15 App Router + Tailwind + shadcn/ui │
│  Zustand（购物车状态）                                     │
└───────────────────────┬─────────────────────────────────┘
                        │ Server Actions / Route Handlers
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js 服务端（Vercel）                 │
│  - 用户认证（Supabase Auth）                              │
│  - 业务逻辑：商品、购物车、订单、支付、库存                 │
│  - 幂等控制、订单状态机                                    │
│  - Prisma Client                                         │
└───────────────────────┬─────────────────────────────────┘
                        │ Prisma
                        ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL（Supabase 托管）                  │
│  User / Product / Category / Cart / Order / Payment ...  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 目录结构

```text
nextcart/
├── app/
│   ├── (shop)/
│   │   ├── page.tsx                    # 首页
│   │   ├── products/
│   │   │   ├── page.tsx                # 商品列表
│   │   │   └── [slug]/page.tsx         # 商品详情
│   │   ├── cart/page.tsx               # 购物车
│   │   ├── checkout/page.tsx           # 结算
│   │   ├── orders/
│   │   │   ├── page.tsx                # 我的订单
│   │   │   └── [id]/page.tsx           # 订单详情
│   │   └── layout.tsx                  # 商城布局
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx                # 后台首页
│   │       ├── products/
│   │       │   ├── page.tsx            # 商品管理
│   │       │   ├── new/page.tsx        # 新建商品
│   │       │   └── [id]/edit/page.tsx  # 编辑商品
│   │       ├── orders/
│   │       │   ├── page.tsx            # 订单管理
│   │       │   └── [id]/page.tsx       # 订单详情
│   │       └── layout.tsx              # 后台布局
│   ├── login/page.tsx                  # 登录
│   ├── register/page.tsx               # 注册
│   ├── api/
│   │   ├── auth/callback/route.ts      # Supabase OAuth 回调
│   │   └── webhooks/stripe/route.ts    # Stripe Webhook
│   ├── layout.tsx                      # 根布局
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui 组件
│   ├── product/                        # 商品相关组件
│   ├── cart/                           # 购物车组件
│   ├── order/                          # 订单组件
│   └── admin/                          # 后台组件
├── actions/
│   ├── auth.ts                         # 认证 Server Actions
│   ├── cart.ts                         # 购物车 Server Actions
│   ├── order.ts                        # 订单 Server Actions
│   ├── product.ts                      # 商品 Server Actions
│   └── admin.ts                        # 后台 Server Actions
├── lib/
│   ├── prisma.ts                       # Prisma Client 单例
│   ├── supabase/
│   │   ├── client.ts                   # 浏览器端 Supabase
│   │   ├── server.ts                   # 服务端 Supabase
│   │   └── middleware.ts               # Supabase 中间件
│   ├── stripe.ts                       # Stripe 客户端
│   ├── auth.ts                         # 权限校验工具
│   ├── validations/                    # Zod schemas
│   └── utils.ts                        # 工具函数
├── store/
│   └── cart-store.ts                   # Zustand 购物车状态
├── prisma/
│   ├── schema.prisma                   # 数据库模型
│   ├── seed.ts                         # 种子数据
│   └── migrations/                     # 迁移文件
├── middleware.ts                       # Next.js 中间件
├── .env.example
├── package.json
└── README.md
```

---

## 5. 环境搭建

### 5.1 初始化项目

```bash
npx create-next-app@latest nextcart \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias "@/*"

cd nextcart
```

### 5.2 安装依赖

```bash
npm install @prisma/client @supabase/ssr @supabase/supabase-js \
  zustand stripe zod

npm install -D prisma vitest @testing-library/react @testing-library/jest-dom \
  playwright @playwright/test
```

### 5.3 初始化 shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button input card dialog table form select textarea badge
```

### 5.4 初始化 Prisma

```bash
npx prisma init
```

### 5.5 环境变量

创建 `.env.local`：

```env
# 数据库
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# OpenAI（可选）
OPENAI_API_KEY="sk-..."
```

### 5.6 常用命令

```bash
npm run dev                 # 启动开发服务器
npx prisma migrate dev      # 创建并应用迁移
npx prisma db seed          # 运行种子数据
npx prisma studio           # 打开数据库可视化
npm run build               # 生产构建
```

---

## 6. 数据库设计

### 6.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ========== 用户与权限 ==========

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  orders    Order[]
  cart      Cart?
  addresses Address[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}

// ========== 商品与分类 ==========

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  products Product[]
  createdAt DateTime @default(now())
}

model Product {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  description String?
  price       Int         // 分为单位，避免浮点误差
  stock       Int         @default(0)
  images      String[]    @default([])
  categoryId  String?
  category    Category?   @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  cartItems   CartItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([categoryId])
  @@index([slug])
}

// ========== 购物车 ==========

model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String  @id @default(cuid())
  cartId    String
  productId String
  quantity  Int
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
}

// ========== 地址 ==========

model Address {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  phone     String
  province  String
  city      String
  district  String
  detail    String
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ========== 订单 ==========

model Order {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  status          OrderStatus   @default(PENDING_PAYMENT)
  totalAmount     Int
  shippingAddress Json          // 地址快照
  items           OrderItem[]
  payment         Payment?
  statusLogs      OrderStatusLog[]
  idempotencyKey  String?       @unique
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  SHIPPED
  COMPLETED
  CANCELLED
  REFUNDING
  REFUNDED
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Int     // 下单时单价
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model OrderStatusLog {
  id        String       @id @default(cuid())
  orderId   String
  order     Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  from      OrderStatus?
  to        OrderStatus
  actorId   String?
  reason    String?
  createdAt DateTime     @default(now())

  @@index([orderId])
}

// ========== 支付 ==========

model Payment {
  id                String        @id @default(cuid())
  orderId           String        @unique
  order             Order         @relation(fields: [orderId], references: [id])
  provider          String        @default("stripe")
  providerPaymentId String?       @unique
  status            PaymentStatus @default(PENDING)
  amount            Int
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

// ========== 幂等 ==========

model IdempotencyKey {
  id          String   @id @default(cuid())
  key         String   @unique
  userId      String
  requestHash String
  response    Json?
  status      String   @default("PROCESSING") // PROCESSING, COMPLETED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

### 6.2 迁移与种子数据

```bash
npx prisma migrate dev --name init
```

`prisma/seed.ts` 示例：

```ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: '电子产品', slug: 'electronics' },
  })

  await prisma.product.createMany({
    data: [
      {
        name: '无线耳机',
        slug: 'wireless-earphones',
        description: '降噪蓝牙耳机',
        price: 29900,
        stock: 100,
        categoryId: category.id,
        images: ['/images/earphones.jpg'],
      },
      {
        name: '机械键盘',
        slug: 'mechanical-keyboard',
        description: 'RGB 机械键盘',
        price: 49900,
        stock: 50,
        categoryId: category.id,
        images: ['/images/keyboard.jpg'],
      },
    ],
    skipDuplicates: true,
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

在 `package.json` 中添加：

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 7. 认证与权限

### 7.1 Supabase Auth 集成

- 使用 `@supabase/ssr` 创建浏览器端与服务端客户端。
- `middleware.ts` 刷新 session。
- 注册时：Supabase Auth 创建用户后，在 Prisma `User` 表中创建对应记录，`id` 与 Supabase `user.id` 一致。
- 登录时：根据 Supabase `user.id` 查询 Prisma `User`，获取角色。

### 7.2 权限校验

`lib/auth.ts`：

```ts
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return prisma.user.findUnique({
    where: { id: user.id },
  })
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('未登录')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw new Error('无权限')
  return user
}
```

### 7.3 中间件保护

`middleware.ts`：

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  const protectedPaths = ['/orders', '/checkout', '/admin']
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected) {
    const supabase = createServerClient(/* ... */)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 8. 路由与页面设计

### 8.1 页面路由

| 路由                          | 页面   | 权限   |
| :-------------------------- | :--- | :--- |
| `/`                         | 首页   | 公开   |
| `/products`                 | 商品列表 | 公开   |
| `/products/[slug]`          | 商品详情 | 公开   |
| `/cart`                     | 购物车  | 公开   |
| `/checkout`                 | 结算   | 登录   |
| `/orders`                   | 我的订单 | 登录   |
| `/orders/[id]`              | 订单详情 | 登录   |
| `/login`                    | 登录   | 公开   |
| `/register`                 | 注册   | 公开   |
| `/admin`                    | 后台首页 | 管理员  |
| `/admin/products`           | 商品管理 | 管理员  |
| `/admin/products/new`       | 新建商品 | 管理员  |
| `/admin/products/[id]/edit` | 编辑商品 | 管理员  |
| `/admin/orders`             | 订单管理 | 管理员  |
| `/admin/orders/[id]`        | 订单详情 | 管理员  |

### 8.2 API 路由

| 路由                     | 方法   | 说明                |
| :--------------------- | :--- | :---------------- |
| `/api/auth/callback`   | GET  | Supabase OAuth 回调 |
| `/api/webhooks/stripe` | POST | Stripe 支付回调       |

### 8.3 Server Actions

| 文件                   | 方法                                       | 说明   |
| :------------------- | :--------------------------------------- | :--- |
| `actions/auth.ts`    | `signUp`, `signIn`, `signOut`            | 认证   |
| `actions/cart.ts`    | `addToCart`, `updateCartItem`, `removeCartItem`, `mergeCart` | 购物车  |
| `actions/order.ts`   | `createOrder`, `cancelOrder`, `requestRefund` | 订单   |
| `actions/product.ts` | `getProducts`, `getProductBySlug`        | 商品查询 |
| `actions/admin.ts`   | `createProduct`, `updateProduct`, `deleteProduct`, `shipOrder`, `approveRefund` | 后台管理 |

---

## 9. 核心模块开发

### 9.1 商品模块

**商品列表**：使用 Server Component 直接查询数据库。

```tsx
// app/(shop)/products/page.tsx
import { prisma } from '@/lib/prisma'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const products = await prisma.product.findMany({
    where: searchParams.category
      ? { category: { slug: searchParams.category } }
      : undefined,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

**商品详情**：根据 `slug` 查询。

```tsx
// app/(shop)/products/[slug]/page.tsx
export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  })

  if (!product) notFound()
  return <ProductDetail product={product} />
}
```

### 9.2 购物车模块

**游客购物车**：Zustand + localStorage。

```ts
// store/cart-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'nextcart-cart' }
  )
)
```

**登录后合并**：登录成功后调用 `mergeCart` Server Action，将本地购物车写入数据库。

### 9.3 下单与库存扣减

**问题**：多个用户同时购买同一商品，简单 `stock - quantity` 会导致超卖。

**方案**：数据库事务 + 条件更新。

```ts
// actions/order.ts
'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { z } from 'zod'

const createOrderSchema = z.object({
  addressId: z.string(),
  idempotencyKey: z.string().uuid(),
})

export async function createOrder(input: z.infer<typeof createOrderSchema>) {
  const user = await requireUser()
  const { addressId, idempotencyKey } = createOrderSchema.parse(input)

  // 幂等检查
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  })
  if (existing?.status === 'COMPLETED') return existing.response
  if (existing?.status === 'PROCESSING') {
    throw new Error('请求正在处理中，请勿重复提交')
  }

  await prisma.idempotencyKey.create({
    data: {
      key: idempotencyKey,
      userId: user.id,
      requestHash: JSON.stringify(input),
      status: 'PROCESSING',
    },
  })

  const order = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
    })
    if (!cart || cart.items.length === 0) throw new Error('购物车为空')

    const address = await tx.address.findFirst({
      where: { id: addressId, userId: user.id },
    })
    if (!address) throw new Error('地址不存在')

    // 库存扣减：条件更新
    for (const item of cart.items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      })
      if (updated.count === 0) {
        throw new Error(`库存不足: ${item.product.name}`)
      }
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    const newOrder = await tx.order.create({
      data: {
        userId: user.id,
        totalAmount,
        shippingAddress: {
          name: address.name,
          phone: address.phone,
          province: address.province,
          city: address.city,
          district: address.district,
          detail: address.detail,
        },
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
        idempotencyKey,
      },
      include: { items: true },
    })

    // 清空购物车
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

    // 创建支付记录
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: totalAmount,
        provider: 'stripe',
        status: 'PENDING',
      },
    })

    return newOrder
  })

  await prisma.idempotencyKey.update({
    where: { key: idempotencyKey },
    data: { status: 'COMPLETED', response: order },
  })

  return order
}
```

### 9.4 订单状态机

**状态定义**：

```text
PENDING_PAYMENT → PAID → SHIPPED → COMPLETED
       ↓            ↓
   CANCELLED    REFUNDING → REFUNDED
```

**允许的转换**：

| 当前状态            | 操作    | 目标状态      | 触发者     |
| :-------------- | :---- | :-------- | :------ |
| PENDING_PAYMENT | 支付成功  | PAID      | 支付回调    |
| PENDING_PAYMENT | 取消/超时 | CANCELLED | 用户/定时任务 |
| PAID            | 发货    | SHIPPED   | 管理员     |
| SHIPPED         | 确认收货  | COMPLETED | 用户      |
| PAID            | 申请退款  | REFUNDING | 用户      |
| REFUNDING       | 同意退款  | REFUNDED  | 管理员     |
| REFUNDING       | 拒绝退款  | PAID      | 管理员     |

**实现**：

```ts
// lib/order-state-machine.ts
import { OrderStatus } from '@prisma/client'

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'REFUNDING'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDING: ['REFUNDED', 'PAID'],
  REFUNDED: [],
}

export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!allowedTransitions[from].includes(to)) {
    throw new Error(`非法状态转换: ${from} -> ${to}`)
  }
}
```

所有状态变更必须通过单一入口函数，并记录 `OrderStatusLog`。

### 9.5 接口幂等

**问题**：用户网络抖动、重复点击、支付回调重试，可能重复创建订单。

**方案**：客户端生成 `Idempotency-Key`，服务端唯一索引 + 状态记录。

- 客户端：`crypto.randomUUID()` 生成 key。
- 服务端：`IdempotencyKey` 表唯一约束。
- 如果已存在 `COMPLETED`，返回首次结果。
- 如果 `PROCESSING`，拒绝重复请求。
- 支付回调同样需要幂等。

---

## 10. 支付集成

### 10.1 创建 Stripe Checkout Session

```ts
// actions/order.ts
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createCheckoutSession(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  })
  if (!order) throw new Error('订单不存在')

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: order.items.map((item) => ({
      price_data: {
        currency: 'cny',
        product_data: { name: item.product.name },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    })),
    metadata: { orderId: order.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
  })

  return session.url
}
```

### 10.2 Stripe Webhook

```ts
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response('Webhook Error', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    if (!orderId) return new Response('Missing orderId', { status: 400 })

    // 幂等处理：检查支付记录状态
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    })
    if (payment?.status === 'SUCCEEDED') {
      return new Response('Already processed', { status: 200 })
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      }),
      prisma.payment.update({
        where: { orderId },
        data: {
          status: 'SUCCEEDED',
          providerPaymentId: session.payment_intent as string,
        },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId,
          from: 'PENDING_PAYMENT',
          to: 'PAID',
          reason: 'Stripe 支付成功',
        },
      }),
    ])
  }

  return new Response('OK', { status: 200 })
}
```

---

## 11. AI 模块（可选）

### 11.1 商品描述生成

```ts
// actions/admin.ts
'use server'

import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateProductDescription(name: string, features: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '你是一个电商文案专家，请生成吸引人的商品描述。',
      },
      {
        role: 'user',
        content: `商品名称：${name}\n特点：${features}`,
      },
    ],
  })
  return completion.choices[0].message.content
}
```

### 11.2 商品推荐

- 使用 OpenAI Embedding API 将商品描述转为向量。
- 存入 PostgreSQL（启用 `pgvector` 扩展）。
- 用户浏览商品时，计算相似度，推荐 Top N。

### 11.3 智能客服（RAG）

- 将商品文档存入向量数据库。
- 用户提问时检索相关商品，结合 LLM 生成回答。

---

## 12. 测试策略

### 12.1 单元测试（Vitest）

- 订单状态机转换
- 幂等逻辑
- 库存扣减边界条件
- Zod 校验 schema

```bash
npm run test
```

### 12.2 E2E 测试（Playwright）

- 注册、登录
- 浏览商品、加入购物车
- 下单、Stripe 测试支付
- 管理员发货

```bash
npx playwright test
```

### 12.3 测试数据

- 使用 Supabase 测试项目或本地 PostgreSQL。
- 每次测试前重置数据库，运行种子数据。

---

## 13. 部署方案

### 13.1 Vercel 部署

1. 推送代码到 GitHub。
2. 在 Vercel 导入仓库。
3. 配置环境变量（与 `.env.local` 一致）。
4. 设置构建命令：

```json
{
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

5. 部署。

### 13.2 数据库迁移

```bash
npx prisma migrate deploy
```

### 13.3 Stripe Webhook

- 在 Stripe Dashboard 添加 Webhook Endpoint：`https://your-domain.vercel.app/api/webhooks/stripe`
- 选择事件：`checkout.session.completed`
- 将签名密钥填入 `STRIPE_WEBHOOK_SECRET`。

### 13.4 域名与 HTTPS

- Vercel 自动提供 HTTPS。
- 可绑定自定义域名。

---

## 14. 开发计划

| 周次    | 任务                        | 产出            |
| :---- | :------------------------ | :------------ |
| 第 1 周 | 环境搭建、Prisma、Supabase Auth | 项目骨架、数据库、注册登录 |
| 第 2 周 | 商品列表、商品详情、分类              | 可浏览商品         |
| 第 3 周 | 购物车（游客 + 登录）              | 可加购、修改数量      |
| 第 4 周 | 下单、库存扣减、幂等                | 可创建订单，不超卖     |
| 第 5 周 | Stripe 支付、订单状态机           | 支付闭环，状态流转     |
| 第 6 周 | 后台管理：商品、订单、发货             | 管理员可操作        |
| 第 7 周 | AI 模块、测试                  | 差异化功能、测试覆盖    |
| 第 8 周 | 部署、README、面试准备            | 在线 Demo、简历项目  |

**重点投入**：第 4 周和第 5 周。库存扣减与订单状态机要能做到画出架构图、写出设计文档、讲清取舍。

---

## 15. 代码规范与 Git 工作流

### 15.1 代码规范

- ESLint + Prettier
- Husky + lint-staged
- commitlint（Conventional Commits）

```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

### 15.2 Git 分支

- `main`：生产分支
- `develop`：开发分支
- `feature/*`：功能分支
- `fix/*`：修复分支

### 15.3 Commit 规范

```text
feat: 添加购物车功能
fix: 修复库存扣减并发问题
docs: 更新开发文档
refactor: 重构订单状态机
test: 添加订单状态机单元测试
```

---

## 16. 简历与面试要点

### 16.1 简历写法示例

> **NextCart 全栈电商平台**（个人项目）  
> 技术栈：React 19、Next.js 15、TypeScript、Prisma、PostgreSQL、Supabase、Stripe、Vercel  
> - 设计并实现基于条件更新的库存扣减方案，在数据库事务中保证高并发下不超卖。  
> - 实现订单状态机，集中管理状态流转，杜绝非法状态变更。  
> - 通过 Idempotency-Key 机制保证下单与支付回调幂等，防止重复订单。  
> - 集成 Stripe 测试支付，完成从购物车到订单的完整闭环。  
> - 部署于 Vercel，项目地址：xxx

### 16.2 高频面试问题

1. **如何防止超卖？**  
   答：数据库事务 + 条件更新 `stock >= quantity`，通过影响行数判断是否成功。

2. **如何保证接口幂等？**  
   答：客户端生成 `Idempotency-Key`，服务端唯一索引 + 状态记录，重复请求返回首次结果。

3. **订单状态如何管理？**  
   答：定义状态枚举与允许转换表，所有变更走单一入口，变更前校验。

4. **为什么选 Next.js Server Actions？**  
   答：减少前后端分离的胶水代码，类型安全，适合全栈个人项目。

5. **AI 功能如何集成？**  
   答：在 Server Action 中调用 OpenAI API，结果入库；或使用 RAG 做智能客服。

6. **Prisma 事务如何工作？**  
   答：`prisma.$transaction` 支持交互式事务，内部操作要么全部成功，要么全部回滚。

7. **Supabase Auth 与 Prisma 如何集成？**  
   答：Supabase 管理认证，Prisma 管理业务数据，用户 ID 保持一致，注册后同步创建 User 记录。

---

## 17. 附录

### 17.1 常用命令

```bash
npm run dev
npx prisma migrate dev --name <name>
npx prisma db seed
npx prisma studio
npm run build
npm run test
npx playwright test
```

### 17.2 学习资源

- Next.js 官方文档：https://nextjs.org/docs
- Prisma 官方文档：https://www.prisma.io/docs
- Supabase 官方文档：https://supabase.com/docs
- Stripe 测试支付：https://stripe.com/docs/testing
- shadcn/ui：https://ui.shadcn.com

### 17.3 项目检查清单

- [ ] 注册、登录、登出正常
- [ ] 商品列表、详情、分类筛选正常
- [ ] 购物车添加、修改、删除正常
- [ ] 下单流程完整，库存扣减正确
- [ ] 订单状态机无非法转换
- [ ] 幂等机制有效，重复提交不会创建多单
- [ ] Stripe 测试支付成功，Webhook 正确处理
- [ ] 后台管理可增删改查商品、发货、退款
- [ ] AI 模块可用（可选）
- [ ] 单元测试与 E2E 测试通过
- [ ] 部署到 Vercel，在线 Demo 可访问
- [ ] README 包含截图、技术栈、Demo 链接

---

**祝你开发顺利，早日拿到心仪 Offer。**