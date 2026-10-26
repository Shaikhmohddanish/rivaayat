import "server-only"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import type { Product } from "@/lib/types"
import { getCache, setCache, REDIS_KEYS } from "@/lib/redis"

// Cache for 1 hour (3600 seconds) since products don't change frequently
const PRODUCTS_CACHE_TTL = 3600
const PRODUCT_CACHE_TTL = 3600

type ProductWithId = Product & { _id: string }

// Query the database directly instead of fetching our own API over HTTP,
// so server components don't depend on NEXT_PUBLIC_APP_URL pointing at a live deployment.
export async function getProducts(): Promise<ProductWithId[]> {
  const cached = await getCache<ProductWithId[]>(REDIS_KEYS.PRODUCT_LIST)
  if (cached) {
    console.log("✅ Products loaded from Redis cache")
    return cached
  }

  console.log("Fetching products from database")
  const db = await getDatabase()
  const products = await db.collection<Product>("products").find({}).toArray()

  const formattedProducts = products.map((p) => ({
    ...p,
    _id: p._id?.toString(),
  })) as ProductWithId[]

  await setCache(REDIS_KEYS.PRODUCT_LIST, formattedProducts, PRODUCTS_CACHE_TTL)
  console.log("✅ Products cached in Redis")

  return formattedProducts
}

export async function getProduct(idOrSlug: string): Promise<ProductWithId | null> {
  const cacheKey = `${REDIS_KEYS.PRODUCT_DETAILS}${idOrSlug}`
  const cached = await getCache<ProductWithId>(cacheKey)
  if (cached) {
    console.log(`✅ Product ${idOrSlug} loaded from Redis cache`)
    return cached
  }

  const db = await getDatabase()

  let product: any = null

  // Try to fetch by ObjectId first
  if (ObjectId.isValid(idOrSlug)) {
    console.log(`Fetching product by ID: ${idOrSlug}`)
    product = await db.collection<Product>("products").findOne({
      _id: new ObjectId(idOrSlug) as any,
    })
  }

  // If not found or invalid ObjectId, try by slug
  if (!product) {
    console.log(`Fetching product by slug: ${idOrSlug}`)
    product = await db.collection<Product>("products").findOne({
      slug: idOrSlug,
    })
  }

  if (!product) return null

  const formattedProduct = {
    ...product,
    _id: product._id?.toString(),
  } as ProductWithId

  await setCache(cacheKey, formattedProduct, PRODUCT_CACHE_TTL)
  console.log(`✅ Product ${idOrSlug} cached in Redis`)

  return formattedProduct
}
