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

async function getTrendingProducts() {
  try {
    return await DatabaseService.getProducts({ sort: 'trending', limit: 8 })
  } catch (error) {
    console.error('Error loading trending products:', error)
    return []
  }
}

export default async function HomePage() {
  const [featuredProducts, newProducts, trendingProducts] = await Promise.all([
    getFeaturedProducts(),
    getNewProducts(),
    getTrendingProducts(),
  ])

  return (
    <HomePageClient featuredProducts={featuredProducts} newProducts={newProducts} trendingProducts={trendingProducts} />
  )
}
