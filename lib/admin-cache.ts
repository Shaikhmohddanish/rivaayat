/**
 * Admin-specific caching utilities using localStorage
 * Used for admin dashboard where data is specific to admin users (1-2 users)
 */

import { getLocalCache, setLocalCache, deleteLocalCache, deleteLocalCachePattern } from './local-storage';

// Cache key prefixes for admin data
export const ADMIN_CACHE_KEYS = {
  DASHBOARD_STATS: 'admin:dashboard:stats',
  ORDERS_LIST: 'admin:orders:list',
  ORDER_DETAILS: 'admin:order:',
  USERS_LIST: 'admin:users:list',
  USER_DETAILS: 'admin:user:',
  PRODUCT_ADMIN_DETAILS: 'admin:product:',
  PRODUCTS_ADMIN_LIST: 'admin:products:list',
  COUPONS_LIST: 'admin:coupons:list',
  COUPON_DETAILS: 'admin:coupon:',
};

// Default TTL for admin cache items (24 hours)
export const ADMIN_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get admin data from localStorage cache
 * @param key Cache key
 * @returns Cached data or null if not found/expired
 */
export function getAdminCache<T>(key: string): T | null {
  return getLocalCache<T>(key);
}

/**
 * Set admin data in localStorage cache with expiration
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time-to-live in milliseconds (default: 24 hours)
 */
export function setAdminCache<T>(key: string, data: T, ttl: number = ADMIN_CACHE_TTL): void {
  setLocalCache(key, data, ttl);
}

/**
 * Delete specific admin cache entry
 * @param key Cache key to delete
 */
export function deleteAdminCache(key: string): void {
  deleteLocalCache(key);
}

/**
 * Delete all admin cache entries matching a pattern
 * @param pattern Pattern to match (e.g., 'admin:orders:*')
 */
export function deleteAdminCachePattern(pattern: string): void {
  deleteLocalCachePattern(pattern);
}

/**
 * Refresh all admin data by clearing all admin cache
 */
export function refreshAllAdminCache(): void {
  deleteLocalCachePattern('admin:*');
}

/**
 * Custom hook to fetch admin data with localStorage caching
 * @param key The cache key
 * @param fetchFn Function to fetch data if not in cache
 * @param dependencies Dependencies array for useEffect
 * @returns [data, loading, error, refresh]
 */
export function useAdminCache<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  dependencies: any[] = []
): [T | null, boolean, Error | null, () => Promise<void>] {
  // This function would be implemented on the client side with React hooks
  // We'll create a separate hook file for this
  throw new Error('useAdminCache must be imported from hooks/use-admin-cache.ts');
}