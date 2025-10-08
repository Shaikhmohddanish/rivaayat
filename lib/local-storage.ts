/**
 * Client-side localStorage caching utilities for user-specific data
 * This is used to cache user profile, addresses and other user-specific data
 * to improve performance and reduce server calls
 */

// Default cache expiration time (24 hours in milliseconds)
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000;

// Local Storage key prefixes
export const LS_KEYS = {
  USER_PROFILE: 'user:profile:',
  USER_ADDRESSES: 'user:addresses:',
  USER_WISHLIST: 'user:wishlist:',
  USER_CART: 'user:cart:',
  USER_ORDERS: 'user:orders:',
};

// Cache item structure
interface CacheItem<T> {
  data: T;
  expiry: number; // timestamp when this item expires
}

/**
 * Set a value in localStorage with expiration
 * @param key The key to store the data under
 * @param value The data to store
 * @param ttlMs Time-to-live in milliseconds (default: 24 hours)
 */
export function setLocalCache<T>(key: string, value: T, ttlMs: number = DEFAULT_CACHE_TTL): void {
  try {
    const item: CacheItem<T> = {
      data: value,
      expiry: Date.now() + ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error setting localStorage cache for key ${key}:`, error);
    // If localStorage is full, clear expired items and try again
    clearExpiredCache();
    try {
      const item: CacheItem<T> = {
        data: value,
        expiry: Date.now() + ttlMs,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (retryError) {
      console.error(`Failed to set cache even after clearing expired items:`, retryError);
    }
  }
}

/**
 * Get a value from localStorage, checking expiration
 * @param key The key to retrieve
 * @returns The cached data or null if not found or expired
 */
export function getLocalCache<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const cachedItem: CacheItem<T> = JSON.parse(item);
    
    // Check if the item has expired
    if (cachedItem.expiry < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cachedItem.data;
  } catch (error) {
    console.error(`Error getting localStorage cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a specific key from localStorage
 * @param key The key to delete
 */
export function deleteLocalCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting localStorage cache for key ${key}:`, error);
  }
}

/**
 * Delete multiple keys matching a pattern from localStorage
 * @param pattern Pattern to match keys (e.g., "user:*")
 */
export function deleteLocalCachePattern(pattern: string): void {
  try {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    // Get all keys that match the pattern
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && regex.test(key)) {
        keys.push(key);
      }
    }
    
    // Delete all matching keys
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error(`Error deleting localStorage cache pattern ${pattern}:`, error);
  }
}

/**
 * Clear all expired items from localStorage
 */
export function clearExpiredCache(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    // Find all expired cache items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        const cachedItem = JSON.parse(item);
        if (cachedItem.expiry && cachedItem.expiry < now) {
          keysToRemove.push(key);
        }
      } catch (parseError) {
        // Skip items that aren't valid JSON or don't have expiry
        continue;
      }
    }
    
    // Remove all expired items
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error(`Error clearing expired cache:`, error);
  }
}

/**
 * Hook to automatically clear expired cache items
 * Call this from a top-level component like _app.js
 */
export function useLocalCacheCleanup(): (() => void) | undefined {
  if (typeof window !== 'undefined') {
    // Clear expired cache on application load
    clearExpiredCache();
    
    // Set up periodic cleanup (once per hour)
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
    const interval = setInterval(clearExpiredCache, CLEANUP_INTERVAL);
    
    // Return cleanup function
    return () => clearInterval(interval);
  }
  return undefined;
}