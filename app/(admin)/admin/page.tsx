import Link from "next/link"
import { getAdminStats } from "@/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  const cards = [
    { label: "商品总数", value: String(stats.productCount), href: "/admin/products" },
    { label: "订单总数", value: String(stats.orderCount), href: "/admin/orders" },
    { label: "待付款订单", value: String(stats.pendingOrders), href: "/admin/orders?status=PENDING_PAYMENT" },
    { label: "注册用户", value: String(stats.userCount), href: "#" },
    { label: "已收款金额", value: formatPrice(stats.revenue), href: "/admin/orders" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {c.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{c.value}</CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
        快速入口：
        <Link href="/admin/products/new" className="mx-1 text-primary hover:underline">
          新建商品
        </Link>
        ·
        <Link href="/admin/orders" className="mx-1 text-primary hover:underline">
          处理订单
        </Link>
        · 订单状态机：待付款 → 已付款 → 已发货 → 已完成，支持退款流转。
      </div>
    </div>
  )
}
