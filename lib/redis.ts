import { createClient } from 'redis';

/**
 * Redis client singleton for caching
 * Used for server-side caching of frequently accessed data
 * Note: Limited to 25MB so use efficiently
 */

// Redis client connection configuration
const getRedisClient = () => {
  // Only create the client on the server side
  if (typeof window !== 'undefined') return null;
  
  // Read Redis connection details from environment variables
  const client = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || '',
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  });

  client.on('error', (err: Error) => {
    console.error('Redis Client Error:', err);
  });

  return client;
};

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
  CATEGORY_LIST: 'categories:list',
};

// Default TTL for cache items (24 hours)
export const DEFAULT_CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

// Initialize the Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Connect to Redis if not already connected
export async function connectToRedis() {
  // Skip on client side
  if (typeof window !== 'undefined') return null;
  
  try {
    // Check if Redis credentials are configured
    if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
      console.warn('Redis connection details missing in environment variables');
      return null;
    }
    
    if (!redisClient) {
      redisClient = getRedisClient();
      
      if (redisClient && !redisClient.isOpen) {
        await redisClient.connect();
      }
    }
    
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
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
    const client = await connectToRedis();
    if (!client) return false;

    const serializedValue = JSON.stringify(value);
    await client.set(key, serializedValue, { EX: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`Error setting Redis cache for key ${key}:`, error);
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
    const client = await connectToRedis();
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error getting Redis cache for key ${key}:`, error);
    return null;
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
 * Close the Redis connection
 */
export async function closeRedisConnection() {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      redisClient = null;
    }
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
}