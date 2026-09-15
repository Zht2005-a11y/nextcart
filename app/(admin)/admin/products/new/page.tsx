import { getCategories } from "@/actions/admin"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">新建商品</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
