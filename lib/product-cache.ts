/**
 * IndexedDB helper for caching product data in the browser
 * Since there are only 10-15 products, we can cache all of them locally
 * This provides instant loading and reduces API calls
 */

const DB_NAME = 'rivaayat-store'
const DB_VERSION = 1
const PRODUCTS_STORE = 'products'
const METADATA_STORE = 'metadata'

// Cache validity: 1 hour
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

interface CacheMetadata {
  key: string
  timestamp: number
  expiresAt: number
}

let dbInstance: IDBDatabase | null = null

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create products store if it doesn't exist
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        const productsStore = db.createObjectStore(PRODUCTS_STORE, { keyPath: '_id' })
        productsStore.createIndex('slug', 'slug', { unique: false })
      }

      // Create metadata store for cache management
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Get cached products list from IndexedDB
 */
export async function getCachedProducts<T>(): Promise<T[] | null> {
  try {
    const db = await initDB()

    // Check if cache is still valid
    const metadata = await new Promise<CacheMetadata | null>((resolve) => {
      const transaction = db.transaction([METADATA_STORE], 'readonly')
      const store = transaction.objectStore(METADATA_STORE)
      const request = store.get('products_list')

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })

    if (!metadata || Date.now() > metadata.expiresAt) {
      console.log('📦 IndexedDB cache expired or not found')
      return null
    }

    // Get all products
    const products = await new Promise<T[]>((resolve, reject) => {
      const transaction = db.transaction([PRODUCTS_STORE], 'readonly')
      const store = transaction.objectStore(PRODUCTS_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result as T[])
      request.onerror = () => reject(request.error)
    })

    if (products && products.length > 0) {
      console.log(`✅ Loaded ${products.length} products from IndexedDB cache`)
      return products
    }

    return null
  } catch (error) {
    console.error('Error reading from IndexedDB:', error)
    return null
  }
}

/**
 * Cache products list in IndexedDB
 */
export async function cacheProducts<T extends { _id: string }>(products: T[]): Promise<boolean> {
  try {
    const db = await initDB()

    // Store products
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([PRODUCTS_STORE], 'readwrite')
      const store = transaction.objectStore(PRODUCTS_STORE)

      // Clear existing products
      store.clear()

      // Add all products
      products.forEach((product) => {
        store.add(product)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })

    // Store metadata
    const metadata: CacheMetadata = {
      key: 'products_list',
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readwrite')
      const store = transaction.objectStore(METADATA_STORE)
      const request = store.put(metadata)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    console.log(`✅ Cached ${products.length} products in IndexedDB`)
    return true
  } catch (error) {
    console.error('Error writing to IndexedDB:', error)
    return false
  }
}

/**
 * Get a single product from IndexedDB by ID or slug
 */
export async function getCachedProduct<T>(idOrSlug: string): Promise<T | null> {
  try {
    const db = await initDB()

    // Try to get by ID first
    const productById = await new Promise<T | null>((resolve) => {
      const transaction = db.transaction([PRODUCTS_STORE], 'readonly')
      const store = transaction.objectStore(PRODUCTS_STORE)
      const request = store.get(idOrSlug)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })

    if (productById) {
      console.log(`✅ Product ${idOrSlug} loaded from IndexedDB cache (by ID)`)
      return productById
    }

    // Try to get by slug
    const productBySlug = await new Promise<T | null>((resolve) => {
      const transaction = db.transaction([PRODUCTS_STORE], 'readonly')
      const store = transaction.objectStore(PRODUCTS_STORE)
      const index = store.index('slug')
      const request = index.get(idOrSlug)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })

    if (productBySlug) {
      console.log(`✅ Product ${idOrSlug} loaded from IndexedDB cache (by slug)`)
      return productBySlug
    }

    return null
  } catch (error) {
    console.error('Error reading product from IndexedDB:', error)
    return null
  }
}

/**
 * Clear all cached data
 */
export async function clearProductCache(): Promise<boolean> {
  try {
    const db = await initDB()

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([PRODUCTS_STORE, METADATA_STORE], 'readwrite')
      
      transaction.objectStore(PRODUCTS_STORE).clear()
      transaction.objectStore(METADATA_STORE).clear()

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })

    console.log('✅ IndexedDB cache cleared')
    return true
  } catch (error) {
    console.error('Error clearing IndexedDB cache:', error)
    return false
  }
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}
