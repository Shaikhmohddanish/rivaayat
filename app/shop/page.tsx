import type { Product } from "@/lib/types"
import { getProducts as getAllProducts } from "@/lib/products"
import { ShopPageClient } from "./shop-client"

// Render per request; Redis handles caching
export const dynamic = "force-dynamic"

async function getProducts() {
  try {
    return await getAllProducts()
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return []
  }
}

async function getFilters(products: Product[]) {
  // Extract unique colors and sizes from all products
  const colors = new Set<string>()
  const sizes = new Set<string>()

  products.forEach((product) => {
    if (product.variations) {
      product.variations.colors?.forEach(color => colors.add(color))
      product.variations.sizes?.forEach(size => sizes.add(size))
    }
  })

  return {
    colors: Array.from(colors).sort(),
    sizes: Array.from(sizes).sort(),
  }
}

export default async function ShopPage() {
  const products = await getProducts()
  const filters = await getFilters(products)

  return <ShopPageClient products={products} availableColors={filters.colors} availableSizes={filters.sizes} />
}
