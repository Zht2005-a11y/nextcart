"use server"

import { revalidatePath } from "next/cache"
import { Enums, Prisma, prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { assertTransition } from "@/lib/order-state-machine"
import { createOrderSchema, addressSchema } from "@/lib/validations"

export type OrderActionState = { error?: string }

/**
 * 创建一个订单。
 * 核心设计：
 * 1. 幂等：IdempotencyKey 唯一索引 + PROCESSING/COMPLETED 状态机，防重复下单；
 * 2. 防超卖：事务内条件更新 stock >= quantity，影响行数为 0 即库存不足，整体回滚；
 * 3. 地址快照：下单时把收货地址序列化进 Order.shippingAddress。
 */
export async function createOrder(input: unknown): Promise<{ orderId?: string; error?: string }> {
  const user = await requireUser()

  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" }
  }
  const { addressId, idempotencyKey } = parsed.data

  // ---- 幂等检查 ----
  const existing = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } })
  if (existing?.status === "COMPLETED") {
    const response = existing.response as { orderId?: string } | null
    return { orderId: response?.orderId }
  }
  if (existing?.status === "PROCESSING") {
    return { error: "订单正在处理中，请勿重复提交" }
  }

  try {
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId: user.id,
        requestHash: JSON.stringify(input),
        status: "PROCESSING",
      },
    })
  } catch {
    // 并发创建冲突：另一请求已占用该 key
    return { error: "订单正在处理中，请勿重复提交" }
  }

  const order = await prisma.$transaction(async (tx) => {
    // 读取购物车
    const cart = await tx.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
    })
    if (!cart || cart.items.length === 0) throw new Error("购物车为空")

    // 校验地址归属
    const address = await tx.address.findFirst({ where: { id: addressId, userId: user.id } })
    if (!address) throw new Error("收货地址不存在")

    // 条件更新扣减库存，防止超卖
    for (const item of cart.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (updated.count === 0) {
        throw new Error(`库存不足：${item.product.name}`)
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
        idempotencyKey,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: { items: true },
    })

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

    await tx.payment.create({
      data: { orderId: newOrder.id, amount: totalAmount, provider: "stripe", status: "PENDING" },
    })

    await tx.orderStatusLog.create({
      data: { orderId: newOrder.id, to: "PENDING_PAYMENT", reason: "创建订单" },
    })

    return newOrder
  })

  await prisma.idempotencyKey.update({
    where: { key: idempotencyKey },
    data: { status: "COMPLETED", response: { orderId: order.id } },
  })

  revalidatePath("/orders")
  revalidatePath("/", "layout")
  return { orderId: order.id }
}

/** 取消订单（待付款状态） */
export async function cancelOrder(orderId: string) {
  const user = await requireUser()
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } })
  if (!order) throw new Error("订单不存在")

  await transitionOrder(order.id, "CANCELLED", user.id, "用户取消订单", async (tx) => {
    // 回补库存
    const items = await tx.orderItem.findMany({ where: { orderId } })
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }
  })

  revalidatePath("/orders")
  revalidatePath(`/orders/${orderId}`)
  return { ok: true }
}

/** 申请退款（已付款状态） */
export async function requestRefund(orderId: string) {
  const user = await requireUser()
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } })
  if (!order) throw new Error("订单不存在")

  await transitionOrder(order.id, "REFUNDING", user.id, "用户申请退款")
  revalidatePath("/orders")
  revalidatePath(`/orders/${orderId}`)
  return { ok: true }
}

/** 确认收货（已发货状态） */
export async function confirmReceipt(orderId: string) {
  const user = await requireUser()
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } })
  if (!order) throw new Error("订单不存在")

  await transitionOrder(order.id, "COMPLETED", user.id, "用户确认收货")
  revalidatePath("/orders")
  revalidatePath(`/orders/${orderId}`)
  return { ok: true }
}

/** 创建 Stripe Checkout Session，返回支付链接（未配置 Stripe 时返回模拟支付成功链接） */
export async function createCheckoutSession(orderId: string) {
  const user = await requireUser()
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: { include: { product: true } } },
  })
  if (!order) throw new Error("订单不存在")
  if (order.status !== "PENDING_PAYMENT") throw new Error("订单状态不可支付")

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    // 本地开发模式：直接模拟支付成功回调
    return { mode: "mock" as const, url: `/orders/${order.id}?mock_pay=1` }
  }

  const { getStripe } = await import("@/lib/stripe")
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: order.items.map((item) => ({
      price_data: {
        currency: "cny",
        product_data: { name: item.product.name },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    })),
    metadata: { orderId: order.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/orders/${order.id}?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/checkout?canceled=1`,
  })

  return { mode: "stripe" as const, url: session.url! }
}

/** 模拟支付成功（本地开发模式，无 Stripe 时使用；逻辑与 Stripe Webhook 一致） */
export async function mockPay(orderId: string) {
  const user = await requireUser()
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { payment: true },
  })
  if (!order) throw new Error("订单不存在")

  // 幂等：已支付成功直接返回
  if (order.payment?.status === "SUCCEEDED") return { ok: true }
  if (order.status !== "PENDING_PAYMENT") throw new Error("订单状态不可支付")

  assertTransition(order.status, "PAID")

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } }),
    prisma.payment.update({
      where: { orderId },
      data: { status: "SUCCEEDED", providerPaymentId: "mock_payment" },
    }),
    prisma.orderStatusLog.create({
      data: {
        orderId,
        from: "PENDING_PAYMENT",
        to: "PAID",
        actorId: "mock",
        reason: "模拟支付成功（本地开发模式）",
      },
    }),
  ])

  revalidatePath("/orders")
  revalidatePath(`/orders/${orderId}`)
  return { ok: true }
}

// ---------- 地址管理 ----------

/** 我的订单列表 */
export async function getMyOrders() {
  const user = await requireUser()
  return prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: { include: { product: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

/** 我的订单详情 */
export async function getMyOrder(id: string) {
  const user = await requireUser()
  return prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: { include: { product: true } },
      payment: true,
      statusLogs: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function getAddresses() {
  const user = await requireUser()
  return prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })
}

export async function createAddress(input: unknown) {
  const user = await requireUser()
  const parsed = addressSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" }
  }
  const data = parsed.data

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    })
  }

  await prisma.address.create({
    data: { ...data, userId: user.id },
  })

  revalidatePath("/checkout")
  return { ok: true }
}

export async function updateAddress(id: string, input: unknown) {
  const user = await requireUser()
  const address = await prisma.address.findFirst({ where: { id, userId: user.id } })
  if (!address) throw new Error("地址不存在")

  const parsed = addressSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" }
  }
  const data = parsed.data

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    })
  }

  await prisma.address.update({ where: { id }, data })
  revalidatePath("/checkout")
  return { ok: true }
}

export async function deleteAddress(id: string) {
  const user = await requireUser()
  await prisma.address.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/checkout")
  return { ok: true }
}

// ---------- 内部：状态机统一入口 ----------

type Tx = Prisma.TransactionClient

async function transitionOrder(
  orderId: string,
  to: Enums.OrderStatus,
  actorId: string,
  reason: string,
  beforeUpdate?: (tx: Tx) => Promise<void>
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error("订单不存在")

  assertTransition(order.status, to)

  await prisma.$transaction(async (tx) => {
    if (beforeUpdate) await beforeUpdate(tx)
    await tx.order.update({ where: { id: orderId }, data: { status: to } })
    await tx.orderStatusLog.create({
      data: { orderId, from: order.status, to, actorId, reason },
    })
  })
}
