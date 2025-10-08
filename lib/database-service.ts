import { productDb as mockProductDb } from "@/lib/db"
import { getDatabase, isMongoDBAvailable } from "@/lib/mongodb-safe"
import type { Product } from "@/lib/types"
import { getCache, setCache, REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/redis"

// Database abstraction layer that handles MongoDB connection gracefully
export class DatabaseService {
  private static mongoChecked = false

  static async getProducts(options: {
    featured?: boolean
    limit?: number
    sort?: 'newest' | 'trending'
  } = {}): Promise<(Product & { _id: string })[]> {
    try {
      // Generate a cache key based on the options
      const cacheKey = `${REDIS_KEYS.PRODUCT_LIST}:${
        options.featured ? 'featured:' : ''
      }${options.sort ? `sort:${options.sort}:` : ''}${
        options.limit ? `limit:${options.limit}` : ''
      }`;
      
      // Try to get from cache first
      const cachedProducts = await getCache<(Product & { _id: string })[]>(cacheKey);
      if (cachedProducts) {
        console.log(`Serving products from Redis cache: ${cacheKey}`);
        return cachedProducts;
      }
      
      // If not in cache, proceed with database fetch
      console.log(`Products cache miss for ${cacheKey}, fetching from database`);
      
      // Check if MongoDB is available and try to use it
      if (!this.mongoChecked) {
        await this.checkMongoConnection()
      }

      let products: (Product & { _id: string })[];
      if (isMongoDBAvailable()) {
        products = await this.getMongoProducts(options)
      } else {
        products = await this.getMockProducts(options)
      }
      
      // Store in cache
      await setCache(cacheKey, products, DEFAULT_CACHE_TTL);
      
      return products;
    } catch (error) {
      console.warn('Database connection failed, falling back to mock data:', error)
      return await this.getMockProducts(options)
    }
  }

  private static async checkMongoConnection(): Promise<void> {
    try {
      const db = await getDatabase()
      this.mongoChecked = true
      if (db) {
        console.log('MongoDB connection successful')
      } else {
        console.log('MongoDB not available, using mock data')
      }
    } catch (error) {
      console.warn('MongoDB connection check failed:', error)
      this.mongoChecked = true
    }
  }

  private static async getMongoProducts(options: {
    featured?: boolean
    limit?: number
    sort?: 'newest' | 'trending'
  }): Promise<(Product & { _id: string })[]> {
    const db = await getDatabase()
    if (!db) {
      throw new Error('MongoDB not available')
    }

    let query: any = {}
    if (options.featured) {
      query.isFeatured = true
    }

    let cursor = db.collection<Product>("products").find(query)

    // Apply sorting
    if (options.sort === 'newest') {
      cursor = cursor.sort({ createdAt: -1 })
    } else if (options.sort === 'trending') {
      cursor = cursor.sort({ viewCount: -1 })
    }

    // Apply limit
    if (options.limit) {
      cursor = cursor.limit(options.limit)
    }

    const products = await cursor.toArray()
    
    return products.map((p) => ({
      ...p,
      _id: p._id?.toString() || '',
    }))
  }

  private static async getMockProducts(options: {
    featured?: boolean
    limit?: number
    sort?: 'newest' | 'trending'
  }): Promise<(Product & { _id: string })[]> {
    const filters: any = {}
    
    if (options.featured) {
      filters.featured = true
    }
    
    if (options.limit) {
      filters.limit = options.limit
    }

    const products = await mockProductDb.find(filters)
    
    return products.map((p) => ({
      ...p,
      _id: p._id?.toString() || '',
    }))
  }
}