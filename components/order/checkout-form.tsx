"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, MapPinIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/utils"
import { createOrder, createCheckoutSession, createAddress } from "@/actions/order"
import type { Prisma } from "@/lib/prisma"

type Address = Prisma.AddressModel
type CartItem = Prisma.CartItemModel & { product: Prisma.ProductModel }

export function CheckoutForm({
  addresses,
  items,
}: {
  addresses: Address[]
  items: CartItem[]
}) {
  const router = useRouter()
  const [addressId, setAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ""
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // 新建地址后自动选中首个/默认地址
  useEffect(() => {
    if (!addressId && addresses.length > 0) {
      setAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0].id)
    }
  }, [addresses, addressId])

  const [showForm, setShowForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detail: "",
    isDefault: false,
  })
  const [addressError, setAddressError] = useState<string | null>(null)

  const totalAmount = items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  function handleSubmit() {
    setError(null)
    if (!addressId) {
      setError("请选择或新建收货地址")
      return
    }

    startTransition(async () => {
      try {
        // 幂等键：每次点击生成，服务端去重
        const res = await createOrder({
          addressId,
          idempotencyKey: crypto.randomUUID(),
        })
        if (res.error) {
          setError(res.error)
          return
        }
        const pay = await createCheckoutSession(res.orderId!)
        router.push(pay.url)
      } catch (e) {
        setError(e instanceof Error ? e.message : "下单失败")
      }
    })
  }

  function handleCreateAddress() {
    setAddressError(null)
    startTransition(async () => {
      try {
        const res = await createAddress(newAddress)
        if (res.error) {
          setAddressError(res.error)
          return
        }
        setShowForm(false)
        router.refresh()
      } catch (e) {
        setAddressError(e instanceof Error ? e.message : "保存失败")
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* 收货地址 */}
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <MapPinIcon className="size-4" /> 收货地址
          </h2>

          {addresses.length === 0 && !showForm && (
            <p className="mb-3 text-sm text-muted-foreground">还没有收货地址，请先添加。</p>
          )}

          <div className="space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                  addressId === a.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={addressId === a.id}
                  onChange={() => setAddressId(a.id)}
                  className="mt-0.5"
                />
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    {a.name} <span className="text-muted-foreground">{a.phone}</span>
                    {a.isDefault && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                        默认
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {a.province} {a.city} {a.district} {a.detail}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {showForm ? (
            <div className="mt-3 space-y-3 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="addr-name">收件人</Label>
                  <Input
                    id="addr-name"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    placeholder="姓名"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addr-phone">手机号</Label>
                  <Input
                    id="addr-phone"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    placeholder="手机号"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addr-province">省</Label>
                  <Input
                    id="addr-province"
                    value={newAddress.province}
                    onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                    placeholder="省份"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addr-city">市</Label>
                  <Input
                    id="addr-city"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="城市"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addr-district">区/县</Label>
                  <Input
                    id="addr-district"
                    value={newAddress.district}
                    onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                    placeholder="区/县"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addr-detail">详细地址</Label>
                  <Input
                    id="addr-detail"
                    value={newAddress.detail}
                    onChange={(e) => setNewAddress({ ...newAddress, detail: e.target.value })}
                    placeholder="街道、门牌号"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                />
                设为默认地址
              </label>
              {addressError && <p className="text-sm text-destructive">{addressError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateAddress} disabled={pending}>
                  {pending && <Loader2Icon className="size-3.5 animate-spin" />}
                  保存地址
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => setShowForm(true)}
            >
              <PlusIcon className="size-3.5" /> 新增地址
            </Button>
          )}
        </section>

        {/* 商品清单 */}
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">商品清单</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {item.product.name}
                  <span className="ml-2 text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="font-medium">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 提交栏 */}
      <div className="h-fit space-y-4 rounded-xl border p-4">
        <h2 className="font-semibold">订单汇总</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">商品金额</span>
          <span className="font-medium">{formatPrice(totalAmount)}</span>
        </div>
        <div className="flex justify-between border-t pt-3 text-base font-bold">
          <span>应付</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleSubmit} disabled={pending || items.length === 0}>
          {pending && <Loader2Icon className="size-4 animate-spin" />}
          提交订单并支付
        </Button>
        <p className="text-xs text-muted-foreground">
          重复点击不会重复下单（幂等键保护）；未配置 Stripe 时将模拟支付。
        </p>
      </div>
    </div>
  )
}
