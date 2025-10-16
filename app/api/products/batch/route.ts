import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/types"

// 🚀 OPTIMIZATION: Batch fetch multiple products in single query
export async function POST(request: Request) {
  try {
    const { productIds } = await request.json()

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "Product IDs array is required" }, { status: 400 })
    }

    // Limit to prevent abuse (max 100 products at once)
    if (productIds.length > 100) {
      return NextResponse.json({ error: "Maximum 100 products per request" }, { status: 400 })
    }

    const db = await getDatabase()

    // Convert string IDs to ObjectId and filter out invalid ones
    const objectIds = productIds
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id))

    if (objectIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    // Batch fetch all products in single query
    const products = await db
      .collection<Product>("products")
      .find({ _id: { $in: objectIds as any } })
      .toArray()

    // Create a map for quick lookup
    const productMap = new Map(
      products.map(p => [p._id.toString(), { ...p, _id: p._id.toString() }])
    )

    // Return products in the same order as requested IDs
    // This ensures consistent ordering for the client
    const orderedProducts = productIds
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => productMap.get(id))
      .filter((p): p is Product & { _id: string } => p !== undefined)

    return NextResponse.json({ 
      products: orderedProducts,
      count: orderedProducts.length 
    })
  } catch (error) {
    console.error("Batch fetch products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
