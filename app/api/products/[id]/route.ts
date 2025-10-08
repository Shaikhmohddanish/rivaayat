import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/types"
import { getCache, setCache, deleteCache, REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/redis"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    // Try to get product from Redis cache first
    const cacheKey = `${REDIS_KEYS.PRODUCT_DETAILS}${id}`
    const cachedProduct = await getCache<Product>(cacheKey)
    
    if (cachedProduct) {
      console.log(`Serving product ${id} from Redis cache`)
      return NextResponse.json(cachedProduct)
    }

    // Cache miss - get from database
    console.log(`Product ${id} cache miss, fetching from database`)
    const db = await getDatabase()
    const product = await db.collection<Product>("products").findOne({ 
      _id: new ObjectId(id) as any 
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const formattedProduct = {
      ...product,
      _id: product._id?.toString(),
    }

    // Cache the product with default TTL (24 hours)
    await setCache(cacheKey, formattedProduct, DEFAULT_CACHE_TTL)

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
