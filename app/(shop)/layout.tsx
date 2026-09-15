import Link from "next/link"
import { StoreIcon, LayoutDashboardIcon } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getServerCart } from "@/actions/cart"
import { CartBadge, OrdersLink } from "@/components/shop/cart-badge"
import { SignOutButton } from "@/components/shop/sign-out-button"

export default async function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  let serverCount = 0
  if (user) {
    const cart = await getServerCart()
    serverCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <StoreIcon className="size-5" />
            NextCart
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/products"
              className="flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              全部商品
            </Link>
            {user && <OrdersLink />}
            <CartBadge loggedIn={!!user} serverCount={serverCount} />
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <LayoutDashboardIcon className="size-4" />
                    管理后台
                  </Link>
                )}
                <span className="max-w-28 truncate text-sm text-muted-foreground">
                  {user.name ?? user.email}
                </span>
                <SignOutButton />
              </div>
            ) : (
              <Link
                href="/login"
                className="flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        NextCart — 全栈电商平台 · React 19 + Next.js 15 + Prisma
      </footer>
    </div>
  )
}
