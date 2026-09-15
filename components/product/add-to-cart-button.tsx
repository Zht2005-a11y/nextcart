"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCartIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { addToCart as serverAddToCart } from "@/actions/cart"

/**
 * 加入购物车按钮。
 * - 游客：写入 Zustand（localStorage 持久化）；
 * - 登录用户：调用 Server Action 写入数据库。
 */
export function AddToCartButton({
  product,
  loggedIn,
  quantity = 1,
}: {
  product: { id: string; slug: string; name: string; price: number; stock: number; images: string[] }
  loggedIn: boolean
  quantity?: number
}) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const soldOut = product.stock <= 0

  function handleAdd() {
    if (soldOut) return
    setMessage(null)
    if (loggedIn) {
      startTransition(async () => {
        try {
          await serverAddToCart(product.id, quantity)
          setMessage("已加入购物车")
          router.refresh()
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "加入失败")
        }
      })
    } else {
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity,
        stock: product.stock,
      })
      setMessage("已加入购物车")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleAdd} disabled={soldOut || pending} className="w-full sm:w-auto">
        {pending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <ShoppingCartIcon className="size-4" />
        )}
        {soldOut ? "暂时缺货" : "加入购物车"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
