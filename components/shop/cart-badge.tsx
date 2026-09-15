"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCartIcon, PackageIcon } from "lucide-react"
import { useCartStore } from "@/store/cart-store"

/**
 * 购物车角标。
 * - 游客：读取 Zustand 持久化购物车数量；
 * - 登录用户：使用服务端传入的数量（服务端购物车为准）。
 */
export function CartBadge({ loggedIn, serverCount = 0 }: { loggedIn: boolean; serverCount?: number }) {
  const items = useCartStore((s) => s.items)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (loggedIn) {
      setCount(serverCount)
    } else {
      setCount(items.reduce((sum, i) => sum + i.quantity, 0))
    }
  }, [loggedIn, serverCount, items])

  return (
    <Link
      href="/cart"
      className="relative flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ShoppingCartIcon className="size-4" />
      购物车
      {count > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  )
}

/** 移动端/次要入口：我的订单 */
export function OrdersLink() {
  return (
    <Link
      href="/orders"
      className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <PackageIcon className="size-4" />
      我的订单
    </Link>
  )
}
