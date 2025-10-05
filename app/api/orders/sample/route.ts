import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { orderDb } from "@/lib/db"

export async function POST() {
  try {
    const user = await requireAuth()
    
    // Create sample orders for testing
    const sampleOrders = [
      {
        userId: user.id,
        items: [
          {
            productId: "prod1",
            name: "Elegant Floral Maxi Dress",
            price: 89.99,
            quantity: 1,
            variant: { color: "Rose Pink", size: "M" }
          },
          {
            productId: "prod2", 
            name: "Classic Black Evening Dress",
            price: 129.99,
            quantity: 1,
            variant: { color: "Black", size: "L" }
          }
        ],
        status: "delivered" as const,
        tracking: {
          carrier: "FedEx",
          trackingId: "1234567890",
          notes: "Package delivered to front door"
        },
        coupon: {
          code: "SAVE10",
          discountPercent: 10
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        userId: user.id,
        items: [
          {
            productId: "prod3",
            name: "Bohemian Summer Dress", 
            price: 69.99,
            quantity: 2,
            variant: { color: "Floral", size: "S" }
          }
        ],
        status: "shipped" as const,
        tracking: {
          carrier: "UPS",
          trackingId: "9876543210",
          notes: "Package is in transit"
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        userId: user.id,
        items: [
          {
            productId: "prod4",
            name: "Silk Wrap Midi Dress",
            price: 159.99,
            quantity: 1,
            variant: { color: "Navy Blue", size: "M" }
          }
        ],
        status: "processing" as const,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        userId: user.id,
        items: [
          {
            productId: "prod5",
            name: "Vintage Lace Tea Dress",
            price: 99.99,
            quantity: 1,
            variant: { color: "Cream", size: "L" }
          }
        ],
        status: "placed" as const,
        createdAt: new Date() // Today
      }
    ]

    // Create all sample orders
    const createdOrders = []
    for (const orderData of sampleOrders) {
      const order = await orderDb.create(orderData)
      createdOrders.push(order)
    }

    return NextResponse.json({
      message: "Sample orders created successfully",
      orders: createdOrders
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Create sample orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}