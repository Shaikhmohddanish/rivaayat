import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"

// 🚀 OPTIMIZATION: Single endpoint for all admin dashboard stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()

    // Parallel fetch all stats in single operation
    const [productsCount, usersCount, ordersCount, couponsResult] = await Promise.all([
      db.collection('products').countDocuments(),
      db.collection('users').countDocuments(),
      db.collection('orders').countDocuments(),
      db.collection('coupons').countDocuments({ isActive: true })
    ])

    return NextResponse.json({
      products: productsCount,
      users: usersCount,
      orders: ordersCount,
      coupons: couponsResult
    })
  } catch (error) {
    console.error("Admin dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
