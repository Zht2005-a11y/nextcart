"use client"

import Link from "next/link"
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { formatPrice } from "@/lib/utils"

/** 游客购物车视图：基于 Zustand + localStorage */
export function GuestCartView() {
  const { items, updateQuantity, removeItem, clear, totalAmount, totalCount } = useCartStore()

  if (items.length === 0) {
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
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-xl border p-3"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  无图
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <Link href={`/products/${item.slug}`} className="line-clamp-1 font-medium hover:underline">
                {item.name}
              </Link>
              <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                aria-label="减少数量"
              >
                <MinusIcon className="size-3" />
              </Button>
              <span className="w-10 text-center text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                aria-label="增加数量"
              >
                <PlusIcon className="size-3" />
              </Button>
            </div>

            <div className="w-20 text-right text-sm font-semibold">
              {formatPrice(item.price * item.quantity)}
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeItem(item.productId)}
              aria-label="删除商品"
              className="text-destructive"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ))}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={clear}>
            清空购物车
          </Button>
        </div>
      </div>

      {/* 汇总 */}
      <div className="h-fit w-full space-y-4 rounded-xl border p-4 lg:w-64">
        <h2 className="font-semibold">购物车汇总</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">共 {totalCount()} 件商品</span>
          <span className="font-semibold">{formatPrice(totalAmount())}</span>
        </div>
        <Link href="/checkout" className="block">
          <Button className="w-full">去结算</Button>
        </Link>
        <p className="text-xs text-muted-foreground">
          结算需要登录，登录后购物车将自动合并。
        </p>
      </div>
    </div>
  )
}
