"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCategory } from "@/actions/admin"

/** 快速新建分类 */
export function CreateCategoryForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await createCategory(name)
      if (res.error) {
        setError(res.error)
        return
      }
      setName("")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="新分类名称"
        className="h-8 w-40"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
        添加分类
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  )
}
