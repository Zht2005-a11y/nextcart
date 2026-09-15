import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { RegisterForm } from "@/components/auth/register-form"

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect("/")

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center">
      <h1 className="mb-6 text-center text-2xl font-bold">注册 NextCart</h1>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
