import { notFound } from "next/navigation"
import Link from "next/link"
import { getProductBySlug } from "@/actions/product"
import { getCurrentUser } from "@/lib/auth"
import { AddToCartButton } from "@/components/product/add-to-cart-button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [product, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()])

  if (!product) notFound()

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* 图片 */}
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            暂无图片
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {product.category.name}
            </Link>
          )}
          {product.stock <= 0 ? (
            <Badge variant="destructive">缺货</Badge>
          ) : (
            <Badge variant="secondary">库存 {product.stock}</Badge>
          )}
        </div>

        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-3xl font-bold">{formatPrice(product.price)}</p>

        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {product.description || "暂无商品描述。"}
        </p>

        <div className="mt-2">
          <AddToCartButton product={product} loggedIn={!!user} />
        </div>

        <div className="mt-4 rounded-xl border p-4 text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">购买须知</p>
          <ul className="list-inside list-disc space-y-1">
            <li>下单将实时校验并扣减库存，防止超卖。</li>
            <li>未登录可直接加入购物车，登录后自动合并。</li>
            <li>支付环节接入 Stripe 测试模式。</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
