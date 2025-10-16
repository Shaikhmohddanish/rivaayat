import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Order } from "@/lib/types"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const db = await getDatabase()
    
    // Users can only access their own orders (unless admin)
    const filter: any = { _id: new ObjectId(id) }
    if (user.role !== "admin") {
      filter.userId = user.id
    }
    
    const order = await db.collection<Order>("orders").findOne(filter)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Fetch tracking information if available
    const tracking = await db.collection('order_tracking').findOne({ orderId: order._id?.toString() })

    const responseData: any = {
      ...order,
      _id: order._id?.toString(),
    }

    // Add tracking history if available
    if (tracking) {
      responseData.trackingHistory = tracking.events
      responseData.currentTrackingStatus = tracking.currentStatus
    }

    return NextResponse.json({ order: responseData })
  } catch (error) {
    console.error("Fetch order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const user = await getCurrentUser()

    // Admin-only endpoint
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const { status, tracking } = await request.json()

    // Validate status if provided
    const validStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    // Build update object
    const updateFields: any = {}
    if (status) updateFields.status = status
    if (tracking) updateFields.tracking = tracking

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const db = await getDatabase()
    const result = await db.collection<Order>("orders").updateOne({ _id: new ObjectId(id) as any }, { $set: updateFields })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Order updated successfully" })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
