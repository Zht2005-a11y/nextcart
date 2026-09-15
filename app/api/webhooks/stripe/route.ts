import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertTransition } from "@/lib/order-state-machine"

/**
 * Stripe Webhook：处理支付回调。
 * - 校验签名；
 * - 幂等：支付记录已 SUCCEEDED 直接返回，避免重复处理；
 * - 事务内完成：订单 → PAID、支付 → SUCCEEDED、写入状态日志。
 * 本地无 Stripe 配置时，模拟支付走 /orders/[id]?mock_pay=1（见 actions/order.ts）。
 */
export async function POST(req: Request) {
  const body = await req.text()

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe 未配置" }, { status: 503 })
  }

  const { getStripe } = await import("@/lib/stripe")
  const stripe = getStripe()
  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "缺少签名" }, { status: 400 })
  }

  let event: import("stripe").Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: "签名校验失败" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    if (!orderId) {
      return NextResponse.json({ error: "缺少 orderId" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    })
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    // 幂等：已支付成功直接返回
    if (order.payment?.status === "SUCCEEDED") {
      return NextResponse.json({ ok: true, duplicated: true })
    }
    // 订单已取消等不可支付状态：记录失败但不报错
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ ok: true, skipped: order.status })
    }

    assertTransition(order.status, "PAID")

    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } }),
      prisma.payment.update({
        where: { orderId },
        data: {
          status: "SUCCEEDED",
          providerPaymentId: (session.payment_intent as string) ?? null,
        },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId,
          from: "PENDING_PAYMENT",
          to: "PAID",
          actorId: "stripe",
          reason: "Stripe 支付成功",
        },
      }),
    ])
  }

  return NextResponse.json({ ok: true })
}
