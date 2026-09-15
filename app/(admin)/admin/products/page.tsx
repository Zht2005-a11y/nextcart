import Link from "next/link"
import { getAdminProducts, getCategories } from "@/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeleteProductButton } from "@/components/admin/delete-product-button"
import { CreateCategoryForm } from "@/components/admin/create-category-form"
import { formatPrice } from "@/lib/utils"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const [products, categories] = await Promise.all([getAdminProducts({ q: params.q }), getCategories()])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Link href="/admin/products/new">
          <Button>新建商品</Button>
        </Link>
      </div>

      {/* 分类管理 */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
        <span className="text-sm text-muted-foreground">分类：</span>
        {categories.map((c) => (
          <Badge key={c.id} variant="secondary">
            {c.name} ({c._count.products})
          </Badge>
        ))}
        <CreateCategoryForm />
      </div>

      {/* 搜索 */}
      <form action="/admin/products" method="get" className="flex max-w-xs gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="按名称搜索…"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          搜索
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">商品</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 text-right font-medium">价格</th>
              <th className="px-4 py-3 text-right font-medium">库存</th>
              <th className="px-4 py-3 text-center font-medium">状态</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  暂无商品
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}/edit`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">/{p.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={p.active ? "secondary" : "outline"}>
                      {p.active ? "上架中" : "已下架"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/admin/products/${p.id}/edit`}>
                        <Button variant="outline" size="sm">编辑</Button>
                      </Link>
                      <DeleteProductButton productId={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
