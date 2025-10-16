import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { items } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items to validate" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // 🚀 OPTIMIZATION: Batch fetch all products in single query
    const productIds = items.map((item: any) => new ObjectId(item.productId))
    const products = await db.collection('products').find({ 
      _id: { $in: productIds } 
    }).toArray()

    // Create a map for quick product lookup
    const productMap = new Map(products.map(p => [p._id.toString(), p]))

    const stockIssues: any[] = []
    const validItems: any[] = []

    for (const item of items) {
      // Get product from map (no DB query)
      const product = productMap.get(item.productId)

      if (!product) {
        stockIssues.push({
          productId: item.productId,
          name: item.name,
          issue: "Product not found",
          requestedQuantity: item.quantity,
          availableStock: 0
        })
        continue
      }

      // Find the specific variant
      const variant = product.variations?.variants?.find(
        (v: any) => v.color === item.variant.color && v.size === item.variant.size
      )

      if (!variant) {
        stockIssues.push({
          productId: item.productId,
          name: item.name,
          variant: item.variant,
          issue: "Variant not found",
          requestedQuantity: item.quantity,
          availableStock: 0
        })
        continue
      }

      // Check if sufficient stock is available
      if (variant.stock < item.quantity) {
        stockIssues.push({
          productId: item.productId,
          name: item.name,
          variant: item.variant,
          issue: "Insufficient stock",
          requestedQuantity: item.quantity,
          availableStock: variant.stock
        })
      } else {
        validItems.push({
          productId: item.productId,
          name: item.name,
          variant: item.variant,
          quantity: item.quantity,
          availableStock: variant.stock
        })
      }
    }

    if (stockIssues.length > 0) {
      return NextResponse.json({ 
        valid: false,
        stockIssues,
        validItems
      }, { status: 200 })
    }

    return NextResponse.json({ 
      valid: true,
      message: "All items have sufficient stock",
      validItems
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Validate stock error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
