import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import type { Prisma } from "@/lib/prisma"

type ProductWithCategory = Prisma.ProductModel & {
  category: Prisma.CategoryModel | null
}

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const image = product.images[0]

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              暂无图片
            </div>
          )}
          {product.stock <= 0 && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              缺货
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-col gap-1.5 pt-3">
          {product.category && (
            <span className="text-xs text-muted-foreground">{product.category.name}</span>
          )}
          <h3 className="line-clamp-1 font-medium">{product.name}</h3>
          <p className="text-base font-semibold">{formatPrice(product.price)}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
