"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProduct, updateProduct } from "@/actions/admin"
import type { Prisma } from "@/lib/prisma"

type Category = Prisma.CategoryModel

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[]
  product?: Prisma.ProductModel
}) {
  const router = useRouter()
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const [price, setPrice] = useState(product ? String(product.price) : "")
  const [stock, setStock] = useState(product ? String(product.stock) : "")
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [images, setImages] = useState(product?.images.join("\n") ?? "")
  const [active, setActive] = useState(product?.active ?? true)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = {
      name,
      slug,
      price: Number(price),
      stock: Number(stock),
      categoryId,
      description,
      images: images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      active,
    }

    startTransition(async () => {
      const res = isEdit
        ? await updateProduct(product!.id, payload)
        : await createProduct(payload)
      if (res.error) {
        setError(res.error)
        return
      }
      router.push("/admin/products")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">商品名称 *</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug *（URL 标识，如 wireless-earphones）</Label>
          <Input id="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">价格（分）*</Label>
          <Input
            id="price"
            type="number"
            required
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="如 29900 = ¥299.00"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">库存 *</Label>
          <Input
            id="stock"
            type="number"
            required
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>分类</Label>
          <Select value={categoryId || undefined} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>状态</Label>
          <Select
            value={active ? "1" : "0"}
            onValueChange={(v) => setActive(v === "1")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">上架</SelectItem>
              <SelectItem value="0">下架</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">商品描述</Label>
        <Textarea
          id="desc"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="商品卖点、规格等"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="images">图片 URL（每行一个）</Label>
        <Textarea
          id="images"
          rows={3}
          value={images}
          onChange={(e) => setImages(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2Icon className="size-4 animate-spin" />}
          {isEdit ? "保存修改" : "创建商品"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          取消
        </Button>
      </div>
    </form>
  )
}
