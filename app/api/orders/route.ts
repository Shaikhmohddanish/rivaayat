import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { OrderValidationError, finalizeOrder, prepareOrderPricing } from "@/lib/order-service"

export async function GET() {
  try {
    const user = await requireAuth()
    
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }
    
    // Fetch from MongoDB
    const orders = await db.collection('orders')
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log("Orders fetched from MongoDB:", orders.length);
    
    return NextResponse.json({ orders })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { items, coupon, shippingAddress } = await request.json()
    const { bulkOps, db, validatedCoupon } = await prepareOrderPricing(items, coupon)
    const { orderId, trackingNumber, order } = await finalizeOrder({
      userId: user.id,
      items,
      shippingAddress,
      coupon: validatedCoupon,
      bulkOps,
      db,
    })

    return NextResponse.json(
      {
        message: "Order created successfully",
        orderId,
        trackingNumber,
        order,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      )
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
