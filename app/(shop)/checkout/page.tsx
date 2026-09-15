import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getServerCart } from "@/actions/cart"
import { getAddresses } from "@/actions/order"
import { CheckoutForm } from "@/components/order/checkout-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CheckoutPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/checkout")

  const [cart, addresses] = await Promise.all([getServerCart(), getAddresses()])
  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">购物车为空，无法结算</p>
        <Link href="/products">
          <Button>去逛逛</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">结算</h1>
      <CheckoutForm addresses={addresses} items={items} />
    </div>
  )
}
