import { notFound } from "next/navigation"
import { getAdminProduct, getCategories } from "@/actions/admin"
import { ProductForm } from "@/components/admin/product-form"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([getAdminProduct(id), getCategories()])
  if (!product) notFound()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">编辑商品</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  )
}
