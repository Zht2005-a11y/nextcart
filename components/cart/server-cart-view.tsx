"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MinusIcon, PlusIcon, Trash2Icon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { updateCartItem, removeCartItem } from "@/actions/cart"
import type { Prisma } from "@/lib/prisma"

type ServerCart = Prisma.CartModel & {
  items: (Prisma.CartItemModel & { product: Prisma.ProductModel })[]
}

/** 登录用户购物车视图：基于数据库 */
export function ServerCartView({ cart }: { cart: ServerCart }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const totalAmount = cart.items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  )

  function act(fn: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : "操作失败")
      }
    })
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">购物车是空的</p>
        <Link href="/products">
          <Button>去逛逛</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-3">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-xl border p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  无图
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.product.slug}`}
                className="line-clamp-1 font-medium hover:underline"
              >
                {item.product.name}
              </Link>
              <p className="text-sm text-muted-foreground">{formatPrice(item.product.price)}</p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={pending}
                onClick={() => act(() => updateCartItem(item.productId, item.quantity - 1))}
                aria-label="减少数量"
              >
                <MinusIcon className="size-3" />
              </Button>
              <span className="w-10 text-center text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={pending}
                onClick={() => act(() => updateCartItem(item.productId, item.quantity + 1))}
                aria-label="增加数量"
              >
                <PlusIcon className="size-3" />
              </Button>
            </div>

            <div className="w-20 text-right text-sm font-semibold">
              {formatPrice(item.product.price * item.quantity)}
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={() => act(() => removeCartItem(item.productId))}
              aria-label="删除商品"
              className="text-destructive"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="h-fit w-full space-y-4 rounded-xl border p-4 lg:w-64">
        <h2 className="font-semibold">购物车汇总</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">共 {cart.items.reduce((s, i) => s + i.quantity, 0)} 件商品</span>
          <span className="font-semibold">{formatPrice(totalAmount)}</span>
        </div>
        <Link href="/checkout" className="block">
          <Button className="w-full" disabled={pending}>
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            去结算
          </Button>
        </Link>
      </div>
    </div>
  )
}
