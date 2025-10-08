import { createClient } from 'redis';

/**
 * Redis client singleton for caching
 * Used for server-side caching of frequently accessed data
 * Note: Limited to 25MB so use efficiently
 */

// Cache key prefixes
export const REDIS_KEYS = {
  // Admin dashboard data
  ADMIN_STATS: 'admin:stats:',
  ADMIN_ORDERS: 'admin:orders:',
  ADMIN_USERS: 'admin:users:',
  // Shared product data
  PRODUCT_DETAILS: 'product:',
  PRODUCT_LIST: 'products:list',
  PRODUCT_SEARCH: 'products:search:',
  PRODUCT_SEARCH_INDEX: 'products:search_index',
  CATEGORY_LIST: 'categories:list',
};

// Default TTL for cache items (24 hours)
export const DEFAULT_CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

// Singleton Redis client
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;
let redisAvailable = false;

// In-memory fallback cache for when Redis is not available
const memoryCache = new Map<string, { value: any; expires: number }>();

// Check if Redis should be used (environment flag)
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false' && 
                      process.env.REDIS_HOST && 
                      process.env.REDIS_PASSWORD;

// Connect to Redis if not already connected
export async function connectToRedis() {
  // Skip on client side
  if (typeof window !== 'undefined') return null;
  
  // If Redis is disabled, return null
  if (!REDIS_ENABLED) {
    return null;
  }
  
  try {
    // Return existing connected client
    if (redisClient && redisClient.isOpen && redisAvailable) {
      return redisClient;
    }

    // If Redis was previously unavailable, don't try again for a while
    if (!redisAvailable && redisClient) {
      return null;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      // Wait for the connection to complete
      let attempts = 0;
      while (isConnecting && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return redisClient && redisClient.isOpen && redisAvailable ? redisClient : null;
    }

    isConnecting = true;

    // Create new client if needed
    if (!redisClient) {
      redisClient = createClient({
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD || '',
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          connectTimeout: 3000,
          keepAlive: true,
          family: 4, // Force IPv4
        }
      });

      redisClient.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        redisAvailable = false;
      });

      redisClient.on('disconnect', () => {
        console.log('Redis client disconnected');
        redisAvailable = false;
      });

      redisClient.on('reconnecting', () => {
        console.log('Redis client reconnecting...');
        redisAvailable = false;
      });

      redisClient.on('connect', () => {
        console.log('Redis connected successfully');
        redisAvailable = true;
      });
    }

    // Connect if not already connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
      redisAvailable = true;
    }

    isConnecting = false;
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis, using memory cache fallback:', error);
    redisAvailable = false;
    isConnecting = false;
    return null;
  }
}

/**
 * Set a value in Redis with expiration
 * @param key The key to store the data under
 * @param value The data to store (will be JSON stringified)
 * @param ttlSeconds Time-to-live in seconds (default: 24 hours)
 */
export async function setCache(key: string, value: any, ttlSeconds: number = DEFAULT_CACHE_TTL) {
  try {
    // Try Redis first if available
    if (REDIS_ENABLED && redisAvailable) {
      const client = await connectToRedis();
      if (client && client.isOpen) {
        const serializedValue = JSON.stringify(value);
        await client.set(key, serializedValue, { EX: ttlSeconds });
        return true;
      }
    }
    
    // Fallback to memory cache
    setMemoryCache(key, value, ttlSeconds);
    return true;
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    // Fallback to memory cache on Redis error
    setMemoryCache(key, value, ttlSeconds);
    redisAvailable = false;
    return false;
  }
}

/**
 * Get a value from Redis
 * @param key The key to retrieve
 * @returns The parsed data or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first if available
    if (REDIS_ENABLED && redisAvailable) {
      const client = await connectToRedis();
      if (client && client.isOpen) {
        const data = await client.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
      }
    }
    
    // Fallback to memory cache
    const memData = getMemoryCache(key);
    return memData as T || null;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    // Fallback to memory cache on Redis error
    redisAvailable = false;
    const memData = getMemoryCache(key);
    return memData as T || null;
  }
}

/**
 * Delete a specific key from Redis
 * @param key The key to delete
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    const client = await connectToRedis();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting Redis cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 * @param pattern Pattern to match keys (e.g., "user:*")
 */
export async function deleteCachePattern(pattern: string): Promise<boolean> {
  try {
    const client = await connectToRedis();
    if (!client) return false;

    let cursor = 0;
    do {
      const { cursor: newCursor, keys } = await client.scan(cursor.toString(), { MATCH: pattern, COUNT: 100 });
      cursor = parseInt(newCursor);
      
      if (keys.length > 0) {
        await client.del(keys);
      }
    } while (cursor !== 0);
    
    return true;
  } catch (error) {
    console.error(`Error deleting Redis cache pattern ${pattern}:`, error);
    return false;
  }
}

/**
 * Memory cache fallback functions
 */
function setMemoryCache(key: string, value: any, ttlSeconds: number = DEFAULT_CACHE_TTL) {
  const expires = Date.now() + (ttlSeconds * 1000);
  memoryCache.set(key, { value, expires });
  
  // Clean up expired entries periodically
  if (memoryCache.size > 1000) {
    cleanupMemoryCache();
  }
}

function getMemoryCache(key: string): any | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expires) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.value;
}

function cleanupMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expires) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (!REDIS_ENABLED) return false;
  
  try {
    const client = await connectToRedis();
    if (!client || !client.isOpen || !redisAvailable) return false;
    
    // Test with a simple ping
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis availability check failed:', error);
    redisAvailable = false;
    return false;
  }
}

/**
 * Get Redis connection status for debugging
 */
export function getRedisStatus() {
  return {
    enabled: REDIS_ENABLED,
    available: redisAvailable,
    connecting: isConnecting,
    connected: redisClient?.isOpen || false,
    memoryCacheSize: memoryCache.size
  };
}

/**
 * Close the Redis connection
 */
export async function closeRedisConnection() {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      redisClient = null;
      isConnecting = false;
      console.log('Redis connection closed');
    }
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    redisClient = null;
    isConnecting = false;
  }
}

/**
 * Get all cached product keys for search functionality
 * @returns Array of product keys
 */
export async function getAllProductKeys(): Promise<string[]> {
  try {
    const client = await connectToRedis();
    if (!client || !client.isOpen) {
      console.log('Redis client not available for key scanning');
      return [];
    }

    let cursor = 0;
    const keys: string[] = [];
    let scanAttempts = 0;
    const maxScanAttempts = 100; // Prevent infinite loops
    
    do {
      try {
        const { cursor: newCursor, keys: batchKeys } = await client.scan(cursor.toString(), { 
          MATCH: `${REDIS_KEYS.PRODUCT_DETAILS}*`, 
          COUNT: 100 
        });
        cursor = parseInt(newCursor);
        keys.push(...batchKeys);
        scanAttempts++;
        
        if (scanAttempts > maxScanAttempts) {
          console.warn('Redis scan exceeded maximum attempts, stopping');
          break;
        }
      } catch (scanError) {
        console.error('Error during Redis scan:', scanError);
        break;
      }
    } while (cursor !== 0);
    
    console.log(`Found ${keys.length} product keys in Redis cache`);
    return keys;
  } catch (error) {
    console.error('Error getting product keys from Redis:', error);
    return [];
  }
}

/**
 * Search products in Redis cache by query
 * @param query Search query string
 * @returns Array of matching products
 */
export async function searchProductsInCache<T>(query: string): Promise<T[]> {
  try {
    // First try to get from memory cache
    const memCacheKey = `search_products_${query.toLowerCase()}`;
    const memResult = getMemoryCache(memCacheKey);
    if (memResult) {
      return memResult as T[];
    }

    // If Redis is available, try to get product keys and search
    if (REDIS_ENABLED && redisAvailable) {
      const client = await connectToRedis();
      if (client && client.isOpen) {
        const productKeys = await getAllProductKeys();
        if (productKeys.length === 0) {
          return [];
        }

        // Limit the number of products to fetch to avoid memory issues
        const maxProducts = 100; // Reduced from 1000
        const keysToFetch = productKeys.slice(0, maxProducts);

        const products: T[] = [];
        
        try {
          // Use individual gets instead of pipeline to reduce connection load
          for (const key of keysToFetch) {
            try {
              const result = await client.get(key);
              if (result) {
                const product = JSON.parse(result);
                if (product) {
                  products.push(product);
                }
              }
            } catch (parseError) {
              console.error(`Error parsing product for key ${key}:`, parseError);
            }
          }
        } catch (fetchError) {
          console.error('Error fetching products from Redis:', fetchError);
          redisAvailable = false;
          return [];
        }

        // Filter products based on search query
        const searchQuery = query.toLowerCase().trim();
        const filteredProducts = products.filter((product: any) => {
          if (!product) return false;
          
          const searchableFields = [
            product.name,
            product.description,
            product.category,
            product.subcategory,
            product.tags?.join(' '),
            product.brand
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchableFields.includes(searchQuery) || 
                 searchQuery.split(' ').some(term => searchableFields.includes(term));
        });

        // Cache in memory for quick access
        setMemoryCache(memCacheKey, filteredProducts, 300); // 5 minutes cache
        return filteredProducts;
      }
    }

    return [];
  } catch (error) {
    console.error('Error searching products in cache:', error);
    redisAvailable = false;
    return [];
  }
}

/**
 * Cache a search result with TTL
 * @param query Search query
 * @param results Search results
 * @param ttlSeconds TTL in seconds (default: 1 hour)
 */
export async function cacheSearchResults<T>(query: string, results: T[], ttlSeconds: number = 3600): Promise<boolean> {
  try {
    const searchKey = `${REDIS_KEYS.PRODUCT_SEARCH}${encodeURIComponent(query.toLowerCase())}`;
    return await setCache(searchKey, results, ttlSeconds);
  } catch (error) {
    console.error('Error caching search results:', error);
    return false;
  }
}

/**
 * Get cached search results
 * @param query Search query
 * @returns Cached search results or null
 */
export async function getCachedSearchResults<T>(query: string): Promise<T[] | null> {
  try {
    const searchKey = `${REDIS_KEYS.PRODUCT_SEARCH}${encodeURIComponent(query.toLowerCase())}`;
    return await getCache<T[]>(searchKey);
  } catch (error) {
    console.error('Error getting cached search results:', error);
    return null;
  }
}