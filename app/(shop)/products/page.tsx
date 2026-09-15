import Link from "next/link"
import { getProducts, getCategories } from "@/actions/product"
import { ProductCard } from "@/components/product/product-card"
import { Input } from "@/components/ui/input"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const params = await searchParams
  const [products, categories] = await Promise.all([
    getProducts({ category: params.category, q: params.q }),
    getCategories(),
  ])

  const activeCategory = params.category
    ? categories.find((c) => c.slug === params.category)
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">
          {activeCategory ? activeCategory.name : "全部商品"}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {products.length} 件
          </span>
        </h1>

        {/* 搜索 */}
        <form action="/products" method="get" className="flex w-full max-w-xs gap-2">
          <Input
            name="q"
            placeholder="搜索商品…"
            defaultValue={params.q}
            className="h-8"
          />
          <button
            type="submit"
            className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            搜索
          </button>
        </form>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            !params.category ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          全部
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              params.category === c.slug
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          没有找到符合条件的商品。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
