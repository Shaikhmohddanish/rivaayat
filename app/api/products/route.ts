import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import type { Product } from "@/lib/types"
import { getCache, setCache, deleteCache, REDIS_KEYS } from "@/lib/redis"

// Cache for 1 hour (3600 seconds) since products don't change frequently
const PRODUCTS_CACHE_TTL = 3600

export async function GET() {
  try {
    // 🚀 Try to get from Redis cache first
    const cached = await getCache<any[]>(REDIS_KEYS.PRODUCT_LIST)
    if (cached) {
      console.log("✅ Products loaded from Redis cache")
      return NextResponse.json(cached)
    }

    console.log("Fetching products from database")
    const db = await getDatabase()
    const products = await db.collection<Product>("products").find({}).toArray()

    const formattedProducts = products.map((p) => ({
      ...p,
      _id: p._id?.toString(),
    }))

    // 🚀 Cache the result in Redis for 1 hour
    await setCache(REDIS_KEYS.PRODUCT_LIST, formattedProducts, PRODUCTS_CACHE_TTL)
    console.log("✅ Products cached in Redis")

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
    const result = await db.collection("products").insertOne({
      name,
      slug,
      description,
      price: Number.parseFloat(price),
      images, // Array of { publicId, url, sortOrder }
      variations, // { colors: [], sizes: [], variants: [] }
      isFeatured: isFeatured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Omit<Product, '_id'>)

    console.log("Product created successfully")
    
    // 🚀 Invalidate products cache
    await deleteCache(REDIS_KEYS.PRODUCT_LIST)
    console.log("✅ Products cache invalidated")
    
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
