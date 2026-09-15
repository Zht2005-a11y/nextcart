"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type GuestCartItem = {
  productId: string
  slug: string
  name: string
  price: number // 分
  image?: string
  quantity: number
  stock: number
}

type CartStore = {
  items: GuestCartItem[]
  addItem: (item: Omit<GuestCartItem, "quantity"> & { quantity?: number }) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  /** 登录后合并本地购物车到数据库后调用 */
  replaceWithServerCart: (items: GuestCartItem[]) => void
  totalCount: () => number
  totalAmount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const qty = item.quantity ?? 1
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(qty, item.stock) }],
          }
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
              : i
          ),
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      clear: () => set({ items: [] }),
      replaceWithServerCart: (items) => set({ items }),
      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "nextcart-cart" }
  )
)
