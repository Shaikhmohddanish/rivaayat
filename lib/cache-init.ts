import { DatabaseService } from '@/lib/database-service'

/**
 * Initialize product data for search functionality
 * This function should be called when the application starts
 */
export async function initializeProductCache(): Promise<void> {
  try {
    console.log('Initializing product data for search...')
    
    // Get all products to warm up the database connection
    const products = await DatabaseService.getProducts({})
    
    if (products.length > 0) {
      console.log(`Successfully loaded ${products.length} products for search`)
    } else {
      console.log('No products found')
    }
  } catch (error) {
    console.error('Error initializing product data:', error)
  }
}

/**
 * Refresh product data
 * Call this when products are updated
 */
export async function refreshProductCache(): Promise<void> {
  try {
    console.log('Refreshing product data...')
    
    // Get fresh products to validate database connection
    const products = await DatabaseService.getProducts({})
    
    if (products.length > 0) {
      console.log(`Successfully refreshed data for ${products.length} products`)
    }
  } catch (error) {
    console.error('Error refreshing product data:', error)
  }
}