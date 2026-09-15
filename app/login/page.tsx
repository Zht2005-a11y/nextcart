import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect("/")

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center">
      <h1 className="mb-6 text-center text-2xl font-bold">登录 NextCart</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
