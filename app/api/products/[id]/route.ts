import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/types"
import { getCache, setCache, REDIS_KEYS } from "@/lib/redis"

// Cache individual products for 1 hour
const PRODUCT_CACHE_TTL = 3600

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // 🚀 Try to get from Redis cache first
    const cacheKey = `${REDIS_KEYS.PRODUCT_DETAILS}${id}`
    const cached = await getCache<any>(cacheKey)
    if (cached) {
      console.log(`✅ Product ${id} loaded from Redis cache`)
      return NextResponse.json(cached)
    }
    
    const db = await getDatabase()
    
    let product: any = null

    // Try to fetch by ObjectId first
    if (ObjectId.isValid(id)) {
      console.log(`Fetching product by ID: ${id}`)
      product = await db.collection<Product>("products").findOne({ 
        _id: new ObjectId(id) as any 
      })
    }
    
    // If not found or invalid ObjectId, try by slug
    if (!product) {
      console.log(`Fetching product by slug: ${id}`)
      product = await db.collection<Product>("products").findOne({ 
        slug: id 
      })
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const formattedProduct = {
      ...product,
      _id: product._id?.toString(),
    }

    // 🚀 Cache the product for 1 hour
    await setCache(cacheKey, formattedProduct, PRODUCT_CACHE_TTL)
    console.log(`✅ Product ${id} cached in Redis`)

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
