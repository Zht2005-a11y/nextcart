import Link from "next/link"
import { getFeaturedProducts, getCategories } from "@/actions/product"
import { ProductCard } from "@/components/product/product-card"
import { Badge } from "@/components/ui/badge"

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(8), getCategories()])

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 px-6 py-16 text-center text-primary-foreground">
        <Badge variant="secondary" className="bg-background/10 text-primary-foreground">
          全栈电商示例项目
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight">
          NextCart 商城
        </h1>
        <p className="max-w-xl text-sm text-primary-foreground/80">
          React 19 + Next.js 15 + Prisma + PostgreSQL 构建的生产级电商平台：
          库存并发扣减、订单状态机、接口幂等、Stripe 支付闭环。
        </p>
        <div className="flex gap-3">
          <Link
            href="/products"
            className="rounded-lg bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
          >
            浏览全部商品
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-primary-foreground/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/10"
          >
            注册体验
          </Link>
        </div>
      </section>

      {/* 分类 */}
      {categories.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">商品分类</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                {c.name}
                <span className="ml-1 text-xs text-muted-foreground">{c._count.products}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 最新商品 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">最新上架</h2>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            查看全部 →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            暂无商品，请先到管理后台添加商品。
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
