"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cancelOrder, requestRefund, confirmReceipt, createCheckoutSession } from "@/actions/order"

/**
 * 订单操作按钮组（按状态渲染）。
 * 状态机：PENDING_PAYMENT→(支付/取消)；PAID→(退款)；SHIPPED→(确认收货)。
 */
export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(fn: () => Promise<unknown>, then?: () => void) {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        then?.()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "操作失败")
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "PENDING_PAYMENT" && (
          <>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const pay = await createCheckoutSession(orderId)
                  window.location.href = pay.url
                })
              }
            >
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              去支付
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => run(() => cancelOrder(orderId))}
            >
              取消订单
            </Button>
          </>
        )}
        {status === "PAID" && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run(() => requestRefund(orderId))}
          >
            申请退款
          </Button>
        )}
        {status === "SHIPPED" && (
          <Button
            disabled={pending}
            onClick={() => run(() => confirmReceipt(orderId))}
          >
            确认收货
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
