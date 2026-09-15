"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

/**
 * 登录用户购物车操作。
 * 游客购物车走 Zustand + localStorage（见 store/cart-store.ts），无需服务端。
 */

/** 获取当前登录用户的购物车（含商品） */
export async function getServerCart() {
  const user = await requireUser()
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: { product: true },
      },
    },
  })
  return cart
}

/** 加入购物车（登录用户） */
export async function addToCart(productId: string, quantity = 1) {
  const user = await requireUser()

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.active) throw new Error("商品不存在或已下架")
  if (quantity < 1) throw new Error("数量必须大于 0")

  await prisma.$transaction(async (tx) => {
    const cart =
      (await tx.cart.findUnique({ where: { userId: user.id } })) ??
      (await tx.cart.create({ data: { userId: user.id } }))

    const existing = await tx.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock)
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      })
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: Math.min(quantity, product.stock),
        },
      })
    }
  })

  revalidatePath("/cart")
  revalidatePath("/", "layout")
}

/** 修改购物车商品数量 */
export async function updateCartItem(productId: string, quantity: number) {
  const user = await requireUser()
  if (quantity < 1) throw new Error("数量必须大于 0")

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error("商品不存在")

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) throw new Error("购物车为空")

  await prisma.cartItem.updateMany({
    where: { cartId: cart.id, productId },
    data: { quantity: Math.min(quantity, product.stock) },
  })

  revalidatePath("/cart")
  revalidatePath("/", "layout")
}

/** 删除购物车商品 */
export async function removeCartItem(productId: string) {
  const user = await requireUser()
  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) return

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId },
  })

  revalidatePath("/cart")
  revalidatePath("/", "layout")
}

/** 登录后合并游客购物车（由客户端在登录成功后调用） */
export async function mergeCart(items: { productId: string; quantity: number }[]) {
  const user = await requireUser()
  if (!items.length) return

  await prisma.$transaction(async (tx) => {
    const cart =
      (await tx.cart.findUnique({ where: { userId: user.id } })) ??
      (await tx.cart.create({ data: { userId: user.id } }))

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } })
      if (!product || !product.active) continue

      const existing = await tx.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
      })
      const qty = Math.max(1, Math.min(item.quantity, product.stock))
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(existing.quantity + qty, product.stock) },
        })
      } else {
        await tx.cartItem.create({
          data: { cartId: cart.id, productId: item.productId, quantity: qty },
        })
      }
    }
  })

  revalidatePath("/cart")
  revalidatePath("/", "layout")
}
