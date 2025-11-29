import { DatabaseService } from "@/lib/database-service"
import { HomePageClient } from "./home-client"

async function getFeaturedProducts() {
  try {
    return await DatabaseService.getProducts({ featured: true, limit: 8 })
  } catch (error) {
    console.error('Error loading featured products:', error)
    return []
  }
}

async function getNewProducts() {
  try {
    return await DatabaseService.getProducts({ sort: 'newest', limit: 8 })
  } catch (error) {
    console.error('Error loading new products:', error)
    return []
  }
}

async function getCategories() {
  try {
    return await DatabaseService.getCategories()
  } catch (error) {
    console.error('Error loading categories:', error)
    return []
  }
}

export default async function HomePage() {
  const [featuredProducts, newProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getNewProducts(),
    getCategories(),
  ])

  return (
    <HomePageClient featuredProducts={featuredProducts} newProducts={newProducts} categories={categories} />
  )
}
