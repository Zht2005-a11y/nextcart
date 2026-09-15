import { getCurrentUser } from "@/lib/auth"
import { getServerCart } from "@/actions/cart"
import { GuestCartView } from "@/components/cart/guest-cart-view"
import { ServerCartView } from "@/components/cart/server-cart-view"

export default async function CartPage() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">购物车</h1>
      {user ? (
        <ServerCartView cart={(await getServerCart()) ?? emptyCart()} />
      ) : (
        <GuestCartView />
      )}
    </div>
  )
}

function emptyCart() {
  return { id: "", userId: "", items: [] as never[], createdAt: new Date(), updatedAt: new Date() }
}
