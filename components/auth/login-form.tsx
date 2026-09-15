"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/actions/auth"
import { mergeCart } from "@/actions/cart"
import { useCartStore } from "@/store/cart-store"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/"
  const items = useCartStore((s) => s.items)
  const replaceWithServerCart = useCartStore((s) => s.replaceWithServerCart)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await signIn({ email, password })
      if (res?.error) {
        setError(res.error)
        return
      }
      // 登录成功后合并游客购物车
      try {
        if (items.length > 0) {
          await mergeCart(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))
        }
        replaceWithServerCart([])
      } catch {
        // 合并失败不阻断登录
      }
      router.push(next)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="至少 8 位"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        登录
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-primary hover:underline">
          立即注册
        </Link>
      </p>
    </form>
  )
}
