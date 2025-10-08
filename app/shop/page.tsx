import type { Product } from "@/lib/types"
import { ShopPageClient } from "./shop-client"

async function getProducts() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products`, {
    cache: "no-store", // We're using Redis for caching, so avoid Next.js cache
  })
  
  if (!response.ok) {
    console.error("Failed to fetch products:", response.statusText)
    return []
  }
  
  return response.json()
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
