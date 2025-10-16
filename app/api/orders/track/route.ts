import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Order } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get("trackingNumber")

    if (!trackingNumber) {
      return NextResponse.json({ error: "Tracking number is required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // 🚀 Fetch tracking from dedicated collection (indexed, fast)
    const tracking = await db.collection('order_tracking').findOne({ trackingNumber })

    if (!tracking) {
      return NextResponse.json({ error: "Tracking information not found" }, { status: 404 })
    }

    // Fetch order details
    const order = await db.collection<Order>("orders").findOne({ trackingNumber })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Combine order and tracking data
    return NextResponse.json({
      ...order,
      _id: order._id?.toString(),
      trackingHistory: tracking.events, // Add tracking events from separate collection
      currentTrackingStatus: tracking.currentStatus
    })
  } catch (error) {
    console.error("Track order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
