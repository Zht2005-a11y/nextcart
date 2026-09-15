"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOutIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/actions/auth"

export function SignOutButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
      router.push("/login")
      router.refresh()
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={pending}>
      {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : <LogOutIcon className="size-3.5" />}
      退出
    </Button>
  )
}
