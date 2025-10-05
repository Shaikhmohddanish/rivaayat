import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { orderDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireAuth()
    
    const orders = await orderDb.findByUserId(user.id)
    
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
    const { items, couponCode } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Validate items structure
    for (const item of items) {
      if (
        !item.productId ||
        !item.name ||
        !item.price ||
        !item.quantity ||
        !item.variant?.color ||
        !item.variant?.size
      ) {
        return NextResponse.json({ error: "Invalid item structure" }, { status: 400 })
      }
    }

    // Mock coupon validation
    let coupon
    if (couponCode) {
      // In real app, validate against database
      if (couponCode === "SAVE10") {
        coupon = { code: couponCode, discountPercent: 10 }
      }
    }

    const order = await orderDb.create({
      userId: user.id,
      items,
      status: "placed",
      ...(coupon && { coupon }),
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Order created successfully",
        orderId: order._id,
        order,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
