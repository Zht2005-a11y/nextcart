import { notFound } from "next/navigation"
import { getAdminOrder } from "@/actions/admin"
import { ORDER_STATUS_LABELS } from "@/lib/order-state-machine"
import { Badge } from "@/components/ui/badge"
import { AdminOrderActions } from "@/components/admin/admin-order-actions"
import { formatPrice } from "@/lib/utils"

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getAdminOrder(id)
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

      {(order.status === "PAID" || order.status === "REFUNDING") && (
        <AdminOrderActions orderId={order.id} status={order.status} />
      )}

      {/* 用户信息 */}
      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-2 font-semibold">用户</h2>
        <p>{order.user.name ?? "—"}</p>
        <p className="text-muted-foreground">{order.user.email}</p>
      </section>

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
              <span className="w-24 text-right font-medium">
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

      {/* 支付 */}
      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-2 font-semibold">支付信息</h2>
        {order.payment ? (
          <div className="space-y-1 text-muted-foreground">
            <p>渠道：{order.payment.provider}</p>
            <p>状态：{order.payment.status}</p>
            {order.payment.providerPaymentId && (
              <p className="break-all font-mono text-xs">流水号：{order.payment.providerPaymentId}</p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">无支付记录</p>
        )}
      </section>

      {/* 收货信息 */}
      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-2 font-semibold">收货信息</h2>
        <p className="font-medium">
          {shipping?.name} {shipping?.phone}
        </p>
        <p className="mt-1 text-muted-foreground">
          {shipping?.province} {shipping?.city} {shipping?.district} {shipping?.detail}
        </p>
      </section>

      {/* 状态日志 */}
      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-3 font-semibold">状态流转记录</h2>
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
