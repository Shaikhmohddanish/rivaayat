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
    const order = await db.collection<Order>("orders").findOne({ trackingNumber })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...order,
      _id: order._id?.toString(),
    })
  } catch (error) {
    console.error("Track order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
