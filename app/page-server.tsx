import { getDatabase } from "@/lib/mongodb"
import type { Product } from "@/lib/types"
import { HomePageClient } from "./page"

async function getFeaturedProducts() {
  const db = await getDatabase()
  const products = await db.collection<Product>("products").find({ isFeatured: true }).limit(8).toArray()

  return products.map((p) => ({
    ...p,
    _id: p._id?.toString(),
  }))
}

async function getNewProducts() {
  const db = await getDatabase()
  const products = await db.collection<Product>("products").find({}).sort({ createdAt: -1 }).limit(8).toArray()

  return products.map((p) => ({
    ...p,
    _id: p._id?.toString(),
  }))
}

export default async function HomePage() {
  const [featuredProducts, newProducts] = await Promise.all([getFeaturedProducts(), getNewProducts()])

  return <HomePageClient featuredProducts={featuredProducts} newProducts={newProducts} />
}
