import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import type { Product } from "@/lib/types"
import { deleteCache, REDIS_KEYS } from "@/lib/redis"
import { getProducts } from "@/lib/products"

export async function GET() {
  try {
    return NextResponse.json(await getProducts())
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
