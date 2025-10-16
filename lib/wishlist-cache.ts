/**
 * 🚀 OPTIMIZATION Item 11: Wishlist Caching
 * 
 * Provides localStorage caching for wishlist data to reduce API calls
 * and provide instant wishlist status display.
 */

const WISHLIST_CACHE_KEY = "rivaayat_wishlist_cache"
const WISHLIST_CACHE_TIMESTAMP_KEY = "rivaayat_wishlist_cache_timestamp"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface WishlistCache {
  productIds: string[]
  count: number
  timestamp: number
}

/**
 * Check if wishlist cache is still valid
 */
export function isWishlistCacheValid(): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const timestamp = localStorage.getItem(WISHLIST_CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false
    
    const age = Date.now() - parseInt(timestamp, 10)
    return age < CACHE_DURATION
  } catch (error) {
    console.debug("Error checking wishlist cache validity:", error)
    return false
  }
}

/**
 * Get cached wishlist data
 */
export function getCachedWishlist(): WishlistCache | null {
  if (typeof window === "undefined") return null
  
  try {
    if (!isWishlistCacheValid()) {
      clearWishlistCache()
      return null
    }
    
    const cached = localStorage.getItem(WISHLIST_CACHE_KEY)
    if (!cached) return null
    
    return JSON.parse(cached)
  } catch (error) {
    console.debug("Error reading wishlist cache:", error)
    clearWishlistCache()
    return null
  }
}

/**
 * Set wishlist cache
 */
export function setCachedWishlist(productIds: string[]): void {
  if (typeof window === "undefined") return
  
  try {
    const cache: WishlistCache = {
      productIds,
      count: productIds.length,
      timestamp: Date.now()
    }
    
    localStorage.setItem(WISHLIST_CACHE_KEY, JSON.stringify(cache))
    localStorage.setItem(WISHLIST_CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.debug("Error setting wishlist cache:", error)
  }
}

/**
 * Clear wishlist cache
 */
export function clearWishlistCache(): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(WISHLIST_CACHE_KEY)
    localStorage.removeItem(WISHLIST_CACHE_TIMESTAMP_KEY)
  } catch (error) {
    console.debug("Error clearing wishlist cache:", error)
  }
}

/**
 * Update wishlist cache when wishlist changes
 */
export function updateWishlistCache(productIds: string[]): void {
  setCachedWishlist(productIds)
  
  // Dispatch event for other components to listen to
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wishlistCacheUpdated", { 
      detail: { 
        productIds, 
        count: productIds.length 
      } 
    }))
  }
}

/**
 * Get wishlist count from cache (fast synchronous operation)
 */
export function getCachedWishlistCount(): number {
  const cache = getCachedWishlist()
  return cache?.count || 0
}

/**
 * Check if product is in wishlist cache (fast synchronous operation)
 */
export function isProductInWishlistCache(productId: string): boolean {
  const cache = getCachedWishlist()
  return cache?.productIds.includes(productId) || false
}
