import { getDatabase } from "@/lib/mongodb"
import type { Product } from "@/lib/types"
import { ShopPageClient } from "./shop-client"

async function getProducts() {
  const db = await getDatabase()
  const products = await db.collection<Product>("products").find({}).sort({ createdAt: -1 }).toArray()

  return products.map((p) => ({
    ...p,
    _id: p._id?.toString(),
  }))
}

async function getFilters() {
  const db = await getDatabase()
  const products = await db.collection<Product>("products").find({}).toArray()

  // Extract unique colors and sizes from all products
  const colors = new Set<string>()
  const sizes = new Set<string>()

  products.forEach((product) => {
    product.variants?.forEach((variant) => {
      if (variant.color) colors.add(variant.color)
      if (variant.size) sizes.add(variant.size)
    })
  })

  return {
    colors: Array.from(colors).sort(),
    sizes: Array.from(sizes).sort(),
  }
}

export default async function ShopPage() {
  const [products, filters] = await Promise.all([getProducts(), getFilters()])

  return <ShopPageClient products={products} availableColors={filters.colors} availableSizes={filters.sizes} />
}
