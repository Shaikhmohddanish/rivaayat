import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"
import { ObjectId } from "mongodb"

// Update order tracking status (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }
    
    const { status, message } = await request.json()
    
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }
    
    // Validate status
    const validStatuses = ["order_confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status",
        validStatuses 
      }, { status: 400 })
    }
    
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    const orderId = params.id
    
    // Check if order exists
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) })
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    
    // Create new tracking event
    const trackingEvent = {
      status,
      timestamp: new Date(),
      message: message || getDefaultMessage(status),
      updatedBy: user.id
    }
    
    // 🚀 Update tracking in separate collection (better performance and scalability)
    const trackingResult = await db.collection('order_tracking').updateOne(
      { orderId },
      {
        $push: { events: trackingEvent } as any,
        $set: { 
          currentStatus: status,
          updatedAt: new Date() 
        }
      },
      { upsert: true } // Create if doesn't exist
    )
    
    // Update order status (denormalized for queries)
    const orderResult = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: { 
          status: mapTrackingStatusToOrderStatus(status),
          updatedAt: new Date() 
        }
      }
    )
    
    if (orderResult.modifiedCount === 0 && trackingResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }
    
    // Get updated tracking
    const tracking = await db.collection('order_tracking').findOne({ orderId })
    
    return NextResponse.json({
      message: "Order tracking status updated successfully",
      tracking
    })
    
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Update order tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get default message for each status
function getDefaultMessage(status: string): string {
  const messages: Record<string, string> = {
    order_confirmed: "Your order has been confirmed and is being prepared for processing.",
    processing: "Your order is being processed and will be shipped soon.",
    shipped: "Your order has been shipped and is on the way.",
    out_for_delivery: "Your order is out for delivery and will reach you soon.",
    delivered: "Your order has been delivered successfully.",
    cancelled: "Your order has been cancelled."
  }
  return messages[status] || "Order status updated."
}

// Helper function to map tracking status to order status
function mapTrackingStatusToOrderStatus(trackingStatus: string): string {
  const statusMap: Record<string, string> = {
    order_confirmed: "placed",
    processing: "processing",
    shipped: "shipped",
    out_for_delivery: "shipped",
    delivered: "delivered",
    cancelled: "cancelled"
  }
  return statusMap[trackingStatus] || "placed"
}
