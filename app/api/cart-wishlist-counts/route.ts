import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"

// 🚀 OPTIMIZATION Item 8: Single endpoint for cart and wishlist counts
export async function GET() {
  try {
    const user = await requireAuth()
    const db = await getDatabase()

    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Fetch cart and wishlist in parallel
    const [cart, wishlist] = await Promise.all([
      db.collection('carts').findOne({ userId: user.id }),
      db.collection('wishlists').findOne({ userId: user.id })
    ])

    const cartItems = cart?.items || []
    const cartCount = cartItems.reduce((sum: number, item: any) => sum + (item?.quantity || 0), 0)
    
    const wishlistProductIds = wishlist?.productIds || []
    const wishlistCount = wishlistProductIds.length

    return NextResponse.json({
      cartCount,
      wishlistCount,
      cartItems,
      wishlistProductIds
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      // Return zero counts for unauthenticated users
      return NextResponse.json({ 
        cartCount: 0, 
        wishlistCount: 0,
        cartItems: [],
        wishlistProductIds: []
      })
    }
    console.error("Cart/Wishlist counts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
