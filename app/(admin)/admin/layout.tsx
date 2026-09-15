import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingCartIcon,
  ArrowLeftIcon,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") redirect("/login")

  const nav = [
    { href: "/admin", label: "仪表盘", icon: LayoutDashboardIcon },
    { href: "/admin/products", label: "商品管理", icon: PackageIcon },
    { href: "/admin/orders", label: "订单管理", icon: ShoppingCartIcon },
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/30">
        <div className="flex h-14 items-center border-b px-4 text-base font-bold">NextCart 管理</div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            返回商城
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
