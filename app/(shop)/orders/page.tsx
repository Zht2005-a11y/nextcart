import Link from "next/link"
import { getMyOrders } from "@/actions/order"
import { ORDER_STATUS_LABELS } from "@/lib/order-state-machine"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"

export default async function OrdersPage() {
  const orders = await getMyOrders()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">我的订单</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="mb-4 text-sm text-muted-foreground">还没有订单</p>
          <Link href="/products">
            <Button>去逛逛</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-xl border p-4 transition-colors hover:bg-muted/30"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {order.createdAt.toLocaleString("zh-CN")}
                </span>
                <Badge variant={order.status === "PENDING_PAYMENT" ? "destructive" : "secondary"}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="line-clamp-1 flex-1 text-sm text-muted-foreground">
                  {order.items.map((i) => i.product.name).join("、")}
                </span>
                <span className="ml-4 font-semibold">{formatPrice(order.totalAmount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
