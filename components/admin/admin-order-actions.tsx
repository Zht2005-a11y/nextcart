"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { shipOrder, approveRefund, rejectRefund } from "@/actions/admin"

/** 后台订单操作（发货 / 退款审批） */
export function AdminOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function run(fn: () => Promise<unknown>) {
    setError(null)
    setPending(true)
    fn()
      .then(() => {
        router.refresh()
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "操作失败")
      })
      .finally(() => setPending(false))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "PAID" && (
          <Button disabled={pending} onClick={() => run(() => shipOrder(orderId))}>
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            发货
          </Button>
        )}
        {status === "REFUNDING" && (
          <>
            <Button disabled={pending} onClick={() => run(() => approveRefund(orderId))}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              同意退款
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => run(() => rejectRefund(orderId))}>
              拒绝退款
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
