"use server"

import { prisma } from "@/lib/prisma"

/** 商品列表（含分类筛选，仅上架商品） */
export async function getProducts(params?: { category?: string; q?: string }) {
  const { category, q } = params ?? {}
  return prisma.product.findMany({
    where: {
      active: true,
      ...(category ? { category: { slug: category } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })
}

/** 商品详情（按 slug） */
export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: { category: true },
  })
}

/** 分类列表（含商品数） */
export async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
}

/** 首页推荐：最新上架商品 */
export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}
