/**
 * 🚀 OPTIMIZATION Item 12: Product List Caching
 * 
 * Provides sessionStorage caching for product lists to reduce API calls
 * and provide faster navigation between pages.
 * 
 * Uses sessionStorage (not localStorage) because:
 * - Product lists can be large
 * - Product data changes more frequently
 * - Session-specific caching is sufficient
 */

import type { Product } from "./types"

const PRODUCT_LIST_CACHE_KEY = "rivaayat_products_cache"
const PRODUCT_LIST_TIMESTAMP_KEY = "rivaayat_products_timestamp"
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes (longer than cart/wishlist)

interface ProductListCache {
  products: (Product & { _id: string })[]
  timestamp: number
  params?: {
    search?: string
    category?: string
    filters?: Record<string, any>
  }
}

/**
 * Check if product list cache is still valid
 */
export function isProductListCacheValid(): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const timestamp = sessionStorage.getItem(PRODUCT_LIST_TIMESTAMP_KEY)
    if (!timestamp) return false
    
    const age = Date.now() - parseInt(timestamp, 10)
    return age < CACHE_DURATION
  } catch (error) {
    console.debug("Error checking product list cache validity:", error)
    return false
  }
}

/**
 * Get cached product list
 */
export function getCachedProductList(): ProductListCache | null {
  if (typeof window === "undefined") return null
  
  try {
    if (!isProductListCacheValid()) {
      clearProductListCache()
      return null
    }
    
    const cached = sessionStorage.getItem(PRODUCT_LIST_CACHE_KEY)
    if (!cached) return null
    
    return JSON.parse(cached)
  } catch (error) {
    console.debug("Error reading product list cache:", error)
    clearProductListCache()
    return null
  }
}

/**
 * Set product list cache
 */
export function setCachedProductList(
  products: (Product & { _id: string })[], 
  params?: Record<string, any>
): void {
  if (typeof window === "undefined") return
  
  try {
    const cache: ProductListCache = {
      products,
      timestamp: Date.now(),
      params
    }
    
    sessionStorage.setItem(PRODUCT_LIST_CACHE_KEY, JSON.stringify(cache))
    sessionStorage.setItem(PRODUCT_LIST_TIMESTAMP_KEY, Date.now().toString())
    
    console.log(`Product list cached: ${products.length} products`)
  } catch (error) {
    // SessionStorage might be full - clear and try again
    console.debug("Error setting product list cache, clearing:", error)
    clearProductListCache()
    try {
      const cache: ProductListCache = {
        products,
        timestamp: Date.now(),
        params
      }
      sessionStorage.setItem(PRODUCT_LIST_CACHE_KEY, JSON.stringify(cache))
      sessionStorage.setItem(PRODUCT_LIST_TIMESTAMP_KEY, Date.now().toString())
    } catch (retryError) {
      console.debug("Failed to cache products after retry:", retryError)
    }
  }
}

/**
 * Clear product list cache
 */
export function clearProductListCache(): void {
  if (typeof window === "undefined") return
  
  try {
    sessionStorage.removeItem(PRODUCT_LIST_CACHE_KEY)
    sessionStorage.removeItem(PRODUCT_LIST_TIMESTAMP_KEY)
  } catch (error) {
    console.debug("Error clearing product list cache:", error)
  }
}

/**
 * Update product list cache
 */
export function updateProductListCache(
  products: (Product & { _id: string })[], 
  params?: Record<string, any>
): void {
  setCachedProductList(products, params)
}

/**
 * Get cached product by ID (fast lookup)
 */
export function getCachedProductById(productId: string): (Product & { _id: string }) | null {
  const cache = getCachedProductList()
  if (!cache) return null
  
  return cache.products.find(p => p._id === productId) || null
}
