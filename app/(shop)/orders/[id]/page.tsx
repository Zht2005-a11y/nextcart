import { notFound } from "next/navigation"
import { getMyOrder, mockPay } from "@/actions/order"
import { ORDER_STATUS_LABELS } from "@/lib/order-state-machine"
import { Badge } from "@/components/ui/badge"
import { OrderActions } from "@/components/order/order-actions"
import { formatPrice } from "@/lib/utils"

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mock_pay?: string; success?: string }>
}) {
  const { id } = await params
  const sp = await searchParams

  // 本地开发模式：模拟支付成功后处理订单状态
  if (sp.mock_pay === "1") {
    await mockPay(id)
  }

  const order = await getMyOrder(id)
  if (!order) notFound()

  const shipping = order.shippingAddress as {
    name?: string
    phone?: string
    province?: string
    city?: string
    district?: string
    detail?: string
  } | null

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">订单详情</h1>
        <Badge variant={order.status === "PENDING_PAYMENT" ? "destructive" : "secondary"}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {sp.success === "1" && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          支付成功，感谢购买！
        </p>
      )}

      {/* 订单操作 */}
      {(order.status === "PENDING_PAYMENT" ||
        order.status === "PAID" ||
        order.status === "SHIPPED") && (
        <OrderActions orderId={order.id} status={order.status} />
      )}

      {/* 商品 */}
      <section className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">商品清单</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">
                {item.product.name}
                <span className="ml-2 text-muted-foreground">× {item.quantity}</span>
              </span>
              <span className="text-muted-foreground">{formatPrice(item.price)}</span>
              <span className="w-20 text-right font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold">
          <span>合计</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </section>

      {/* 收货信息 */}
      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-3 font-semibold">收货信息</h2>
        <p className="font-medium">
          {shipping?.name} {shipping?.phone}
        </p>
        <p className="mt-1 text-muted-foreground">
          {shipping?.province} {shipping?.city} {shipping?.district} {shipping?.detail}
        </p>
      </section>

      {/* 状态日志 */}
      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-3 font-semibold">订单状态记录</h2>
        <div className="space-y-2">
          {order.statusLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-muted-foreground">
              <span>
                {log.from ? `${ORDER_STATUS_LABELS[log.from]} → ` : ""}
                {ORDER_STATUS_LABELS[log.to]}
                {log.reason ? `（${log.reason}）` : ""}
              </span>
              <span className="text-xs">{log.createdAt.toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
