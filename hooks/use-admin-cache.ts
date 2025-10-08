'use client';

import { useState, useEffect } from 'react';
import { 
  getAdminCache, 
  setAdminCache, 
  ADMIN_CACHE_TTL, 
  deleteAdminCache 
} from '@/lib/admin-cache';

/**
 * Custom hook to fetch admin data with localStorage caching
 * @param key The cache key
 * @param fetchFn Function to fetch data if not in cache
 * @param dependencies Dependencies array for useEffect
 * @param ttl Cache time-to-live in ms (default: 24 hours)
 * @returns [data, loading, error, refresh]
 */
export function useAdminCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  ttl: number = ADMIN_CACHE_TTL
): [T | null, boolean, Error | null, () => Promise<void>] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch fresh data and update cache
  const fetchData = async (skipCache = false) => {
    setLoading(true);
    setError(null);

    try {
      // Try to get data from cache first (if skipCache is false)
      if (!skipCache) {
        const cachedData = getAdminCache<T>(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      
      // Update state
      setData(freshData);
      
      // Update cache
      setAdminCache(key, freshData, ttl);
      
    } catch (err) {
      console.error(`Error fetching admin data for ${key}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function that bypasses cache
  const refresh = async () => {
    // Clear the specific cache entry
    deleteAdminCache(key);
    // Fetch fresh data
    await fetchData(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return [data, loading, error, refresh];
}