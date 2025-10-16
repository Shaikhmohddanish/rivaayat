import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"

// API endpoint to fix missing order tracking data
export async function POST() {
  try {
    await requireAdmin()
    
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Find all orders that don't have tracking entries
    const orders = await db.collection('orders').find({}).toArray()
    console.log(`Found ${orders.length} orders`)

    let fixedCount = 0

    for (const order of orders) {
      const orderId = order._id?.toString()
      if (!orderId) continue

      // Check if tracking already exists
      const existingTracking = await db.collection('order_tracking').findOne({ orderId })
      
      if (!existingTracking) {
        console.log(`Creating tracking for order ${orderId}`)

        // Generate tracking number if missing
        let trackingNumber = order.trackingNumber
        if (!trackingNumber) {
          const date = new Date(order.createdAt || new Date())
          const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
          const randomPart = Math.floor(1000 + Math.random() * 9000)
          trackingNumber = `RIV-${dateStr}-${randomPart}`
          
          // Update order with tracking number
          await db.collection('orders').updateOne(
            { _id: order._id },
            { $set: { trackingNumber } }
          )
        }

        // Create initial tracking entry
        const initialEvent = {
          status: "order_confirmed",
          timestamp: order.createdAt || new Date(),
          message: "Your order has been confirmed and is being prepared for processing."
        }

        // Map order status to tracking status
        let currentStatus = "order_confirmed"
        const events = [initialEvent]

        if (order.status && order.status !== "placed") {
          const statusMap: Record<string, string> = {
            processing: "processing", 
            shipped: "shipped",
            delivered: "delivered",
            cancelled: "cancelled"
          }
          
          const trackingStatus = statusMap[order.status] || "order_confirmed"
          if (trackingStatus !== "order_confirmed") {
            currentStatus = trackingStatus
            events.push({
              status: trackingStatus,
              timestamp: order.updatedAt || order.createdAt || new Date(),
              message: `Order status updated to ${trackingStatus}.`
            })
          }
        }

        await db.collection('order_tracking').insertOne({
          orderId,
          trackingNumber,
          userId: order.userId,
          events,
          currentStatus,
          createdAt: order.createdAt || new Date(),
          updatedAt: new Date(),
        })

        fixedCount++
      }
    }

    return NextResponse.json({ 
      message: `Successfully fixed ${fixedCount} orders with missing tracking data`,
      ordersProcessed: orders.length,
      ordersFixed: fixedCount
    })
    
  } catch (error) {
    console.error("Error fixing order tracking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}