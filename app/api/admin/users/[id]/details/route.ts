import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User, Order } from "@/lib/types"

// GET /api/admin/users/[id]/details - Admin only endpoint to get detailed user info including orders
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Verify admin session
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the database connection
    const db = await getDatabase()

    // Get user details
    const user = await db
      .collection<User>("users")
      .findOne(
        { _id: new ObjectId(id) as any },
        { projection: { password: 0 } } // Exclude password field
      )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user orders
    const orders = await db
      .collection<Order>("orders")
      .find({ userId: id })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate total business done
    const totalBusiness = orders.reduce((sum: number, order: Order) => {
      // Calculate order total considering discounts if available
      const orderTotal = order.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0)
      
      // Apply coupon discount if present
      if (order.coupon && order.coupon.discountPercent) {
        const discountMultiplier = 1 - (order.coupon.discountPercent / 100)
        return sum + (orderTotal * discountMultiplier)
      }
      
      return sum + orderTotal
    }, 0)

    // Get order counts by status
    const orderStatusCounts = {
      total: orders.length,
      placed: orders.filter((order: Order) => order.status === "placed").length,
      processing: orders.filter((order: Order) => order.status === "processing").length,
      shipped: orders.filter((order: Order) => order.status === "shipped").length,
      delivered: orders.filter((order: Order) => order.status === "delivered").length,
      cancelled: orders.filter((order: Order) => order.status === "cancelled").length,
    }

    const response = {
      user: {
        _id: user._id?.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        provider: user.provider,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        disabled: user.disabled || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      orders: orders.map((order: Order) => ({
        ...order,
        _id: order._id?.toString()
      })),
      analytics: {
        totalBusiness: totalBusiness,
        orderCount: orders.length,
        orderStatusCounts: orderStatusCounts,
        averageOrderValue: orders.length > 0 ? totalBusiness / orders.length : 0
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching user details:", error)
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 })
  }
}