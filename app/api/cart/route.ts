import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"

export async function GET() {
  try {
    const user = await requireAuth()
    
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    const cart = await db.collection('carts').findOne({ userId: user.id })

    return NextResponse.json({
      items: cart?.items || [],
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Get cart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await requireAuth()
    
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Delete the user's cart
    await db.collection('carts').deleteOne({ userId: user.id })

    return NextResponse.json({ message: "Cart cleared successfully" })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Delete cart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
