import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"

// Helper function to normalize userId to string
function normalizeUserId(user: any): string {
  // Use optional chaining and nullish coalescing for safe type handling
  return user?.id?.toString?.() || user?.id || '';
}

// GET the user's wishlist
export async function GET() {
  try {
    const user = await requireAuth()
    
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Normalize user ID for consistent querying
    const userId = normalizeUserId(user)
    
    const wishlist = await db.collection('wishlists').findOne({ userId })

    return NextResponse.json({
      productIds: wishlist?.productIds || [],
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Get wishlist error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Toggle a product in the wishlist (add if not present, remove if present)
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Find existing wishlist - use string userId for consistency
    const userId = normalizeUserId(user)
    
    const wishlist = await db.collection('wishlists').findOne({ userId })
    const productIds = wishlist?.productIds || []
    
    // Toggle the product
    let newProductIds
    let action
    
    if (productIds.includes(productId)) {
      // Remove product
      newProductIds = productIds.filter((id: string) => id !== productId)
      action = "removed"
    } else {
      // Add product
      newProductIds = [...productIds, productId]
      action = "added"
    }
    
    await db.collection('wishlists').updateOne(
      { userId },
      { 
        $set: { 
          userId, // Ensure userId is set correctly
          productIds: newProductIds,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    return NextResponse.json({
      message: `Product ${action}`,
      productIds: newProductIds,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Update wishlist error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}