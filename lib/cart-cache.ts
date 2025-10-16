/**
 * 🚀 OPTIMIZATION Item 10: Cart Data Caching
 * 
 * Provides localStorage caching for cart data to reduce API calls
 * and provide instant cart display on page load.
 */

import type { CartItem } from "./types"

const CART_CACHE_KEY = "rivaayat_cart_cache"
const CART_CACHE_TIMESTAMP_KEY = "rivaayat_cart_cache_timestamp"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CartCache {
  items: CartItem[]
  count: number
  timestamp: number
}

/**
 * Check if cart cache is still valid
 */
export function isCartCacheValid(): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const timestamp = localStorage.getItem(CART_CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false
    
    const age = Date.now() - parseInt(timestamp, 10)
    return age < CACHE_DURATION
  } catch (error) {
    console.debug("Error checking cart cache validity:", error)
    return false
  }
}

/**
 * Get cached cart data
 */
export function getCachedCart(): CartCache | null {
  if (typeof window === "undefined") return null
  
  try {
    if (!isCartCacheValid()) {
      clearCartCache()
      return null
    }
    
    const cached = localStorage.getItem(CART_CACHE_KEY)
    if (!cached) return null
    
    return JSON.parse(cached)
  } catch (error) {
    console.debug("Error reading cart cache:", error)
    clearCartCache()
    return null
  }
}

/**
 * Set cart cache
 */
export function setCachedCart(items: CartItem[]): void {
  if (typeof window === "undefined") return
  
  try {
    const count = items.reduce((sum, item) => sum + (item?.quantity || 0), 0)
    const cache: CartCache = {
      items,
      count,
      timestamp: Date.now()
    }
    
    localStorage.setItem(CART_CACHE_KEY, JSON.stringify(cache))
    localStorage.setItem(CART_CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.debug("Error setting cart cache:", error)
  }
}

/**
 * Clear cart cache
 */
export function clearCartCache(): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(CART_CACHE_KEY)
    localStorage.removeItem(CART_CACHE_TIMESTAMP_KEY)
  } catch (error) {
    console.debug("Error clearing cart cache:", error)
  }
}

/**
 * Update cart cache when cart changes
 */
export function updateCartCache(items: CartItem[]): void {
  setCachedCart(items)
  
  // Dispatch event for other components to listen to
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cartCacheUpdated", { 
      detail: { 
        items, 
        count: items.reduce((sum, item) => sum + (item?.quantity || 0), 0) 
      } 
    }))
  }
}

/**
 * Get cart count from cache (fast synchronous operation)
 */
export function getCachedCartCount(): number {
  const cache = getCachedCart()
  return cache?.count || 0
}
