"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2Icon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteProduct } from "@/actions/admin"

export function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!window.confirm(`确定删除商品「${name}」？`)) return
    setError(null)
    startTransition(async () => {
      const res = await deleteProduct(productId)
      if (res.error) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        disabled={pending}
        className="text-destructive"
        aria-label={`删除 ${name}`}
      >
        {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : <Trash2Icon className="size-3.5" />}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
