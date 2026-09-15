import Link from "next/link"
import { getAdminOrders } from "@/actions/admin"
import { ORDER_STATUS_LABELS } from "@/lib/order-state-machine"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

const STATUS_FILTERS = ["ALL", "PENDING_PAYMENT", "PAID", "SHIPPED", "COMPLETED", "CANCELLED", "REFUNDING", "REFUNDED"] as const

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const status = params.status ?? "ALL"
  const orders = await getAdminOrders({ status })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">订单管理</h1>
      </div>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={s === "ALL" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              status === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {s === "ALL" ? "全部" : ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">订单号</th>
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 text-right font-medium">金额</th>
              <th className="px-4 py-3 font-medium">商品</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  暂无订单
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-primary hover:underline">
                      {o.id.slice(-10)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.user.name ?? "—"}
                    <span className="block text-xs text-muted-foreground">{o.user.email}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatPrice(o.totalAmount)}</td>
                  <td className="max-w-40 truncate px-4 py-3 text-muted-foreground">
                    {o.items.map((i) => i.product.name).join("、")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={o.status === "PENDING_PAYMENT" ? "destructive" : "secondary"}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {o.createdAt.toLocaleString("zh-CN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
