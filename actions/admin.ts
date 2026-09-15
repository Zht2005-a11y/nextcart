"use server"

import { revalidatePath } from "next/cache"
import { Enums, Prisma, prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { assertTransition } from "@/lib/order-state-machine"
import { productInputSchema, updateProductSchema } from "@/lib/validations"

export type AdminActionState = { error?: string }

/** 后台首页统计 */
export async function getAdminStats() {
  await requireAdmin()

  const [productCount, orderCount, userCount, pendingOrders, revenue] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } },
        _sum: { totalAmount: true },
      }),
    ])

  return {
    productCount,
    orderCount,
    userCount,
    pendingOrders,
    revenue: revenue._sum.totalAmount ?? 0,
  }
}

/** 商品管理列表（含下架） */
export async function getAdminProducts(params?: { q?: string }) {
  await requireAdmin()
  return prisma.product.findMany({
    where: params?.q
      ? { name: { contains: params.q, mode: "insensitive" } }
      : undefined,
    include: { category: true, _count: { select: { orderItems: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAdminProduct(id: string) {
  await requireAdmin()
  return prisma.product.findUnique({ where: { id } })
}

/** 创建商品 */
export async function createProduct(input: unknown): Promise<AdminActionState> {
  await requireAdmin()
  const parsed = productInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" }
  }
  const data = parsed.data

  const slugExists = await prisma.product.findUnique({ where: { slug: data.slug } })
  if (slugExists) return { error: "slug 已存在，请更换" }

  await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: data.price,
      stock: data.stock,
      categoryId: data.categoryId || null,
      images: data.images,
      active: data.active,
    },
  })

  revalidatePath("/", "layout")
  revalidatePath("/admin/products")
  return {}
}

/** 更新商品 */
export async function updateProduct(id: string, input: unknown): Promise<AdminActionState> {
  await requireAdmin()
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) return { error: "商品不存在" }

  const parsed = updateProductSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" }
  }
  const data = parsed.data

  if (data.slug) {
    const dup = await prisma.product.findFirst({
      where: { slug: data.slug, NOT: { id } },
    })
    if (dup) return { error: "slug 已存在，请更换" }
  }

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      slug: data.slug ?? existing.slug,
      description: data.description !== undefined ? data.description || null : existing.description,
      price: data.price ?? existing.price,
      stock: data.stock ?? existing.stock,
      categoryId: data.categoryId !== undefined ? data.categoryId || null : existing.categoryId,
      images: data.images ?? existing.images,
      active: data.active ?? existing.active,
    },
  })

  revalidatePath("/", "layout")
  revalidatePath("/admin/products")
  return {}
}

/** 删除商品（有订单记录的商品禁止删除） */
export async function deleteProduct(id: string): Promise<AdminActionState> {
  await requireAdmin()
  const usage = await prisma.orderItem.count({ where: { productId: id } })
  if (usage > 0) {
    return { error: "该商品已有订单记录，不能删除，请改为下架" }
  }
  await prisma.product.delete({ where: { id } })
  revalidatePath("/", "layout")
  revalidatePath("/admin/products")
  return {}
}

/** 分类管理 */
export async function getCategories() {
  await requireAdmin()
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
}

export async function createCategory(name: string): Promise<AdminActionState> {
  await requireAdmin()
  if (!name.trim()) return { error: "请输入分类名称" }
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-")
  try {
    await prisma.category.create({ data: { name: name.trim(), slug } })
  } catch {
    return { error: "分类已存在" }
  }
  revalidatePath("/", "layout")
  revalidatePath("/admin/products")
  return {}
}

// ---------- 订单管理 ----------

export async function getAdminOrders(params?: { status?: string }) {
  await requireAdmin()
  return prisma.order.findMany({
    where: params?.status && params.status !== "ALL" ? { status: params.status as Enums.OrderStatus } : undefined,
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAdminOrder(id: string) {
  await requireAdmin()
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: true } },
      payment: true,
      statusLogs: { orderBy: { createdAt: "desc" } },
    },
  })
}

/** 发货 */
export async function shipOrder(orderId: string) {
  await requireAdmin()
  await adminTransition(orderId, "SHIPPED", "管理员发货")
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/orders")
  return { ok: true }
}

/** 同意退款 */
export async function approveRefund(orderId: string) {
  await requireAdmin()
  await adminTransition(orderId, "REFUNDED", "管理员同意退款", async (tx) => {
    const items = await tx.orderItem.findMany({ where: { orderId } })
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }
    await tx.payment.updateMany({
      where: { orderId },
      data: { status: "REFUNDED" },
    })
  })
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/orders")
  return { ok: true }
}

/** 拒绝退款（回到已付款） */
export async function rejectRefund(orderId: string) {
  await requireAdmin()
  await adminTransition(orderId, "PAID", "管理员拒绝退款")
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/orders")
  return { ok: true }
}

// ---------- 内部 ----------

type Tx = Prisma.TransactionClient

async function adminTransition(
  orderId: string,
  to: Enums.OrderStatus,
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
      data: { orderId, from: order.status, to, actorId: "admin", reason },
    })
  })
}
