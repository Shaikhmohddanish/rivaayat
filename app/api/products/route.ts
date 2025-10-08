import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import type { Product } from "@/lib/types"
import { getCache, setCache, deleteCache, deleteCachePattern, REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/redis"

export async function GET() {
  try {
    // Try to get products from Redis cache first
    const cachedProducts = await getCache<Product[]>(REDIS_KEYS.PRODUCT_LIST)
    
    if (cachedProducts) {
      console.log("Serving products from Redis cache")
      return NextResponse.json(cachedProducts)
    }

    // Cache miss - get from database
    console.log("Products cache miss, fetching from database")
    const db = await getDatabase()
    const products = await db.collection<Product>("products").find({}).toArray()

    const formattedProducts = products.map((p) => ({
      ...p,
      _id: p._id?.toString(),
    }))

    // Cache the products with default TTL (24 hours)
    await setCache(REDIS_KEYS.PRODUCT_LIST, formattedProducts, DEFAULT_CACHE_TTL)

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, slug, description, price, images, variations, isFeatured } = body

    if (!name || !slug || !description || !price || !images || !variations) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const result = await db.collection<Product>("products").insertOne({
      name,
      slug,
      description,
      price: Number.parseFloat(price),
      images, // Array of { publicId, url, sortOrder }
      variations, // { colors: [], sizes: [], variants: [] }
      isFeatured: isFeatured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

        // Invalidate products cache after adding a new product
    // Invalidate all product lists with various filters
    await deleteCachePattern(`${REDIS_KEYS.PRODUCT_LIST}*`)
    // Also invalidate any search caches
    await deleteCachePattern(`${REDIS_KEYS.PRODUCT_SEARCH}*`)
    
    return NextResponse.json(
      {
        message: "Product created successfully",
        productId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Create product error:", error)
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
