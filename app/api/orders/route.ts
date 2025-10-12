import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"
import { ObjectId } from "mongodb"

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

    // Use the coupon information passed from client
    // In a real app, you'd validate the coupon again server-side

    // Generate a tracking number (format: RIV-YYYYMMDD-XXXX)
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const trackingNumber = `RIV-${dateStr}-${randomPart}`;
    
    // Create the order object
    const orderData = {
      userId: user.id,
      items,
      status: "placed",
      trackingNumber,
      shippingAddress,
      ...(coupon && { coupon }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Get MongoDB connection
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }
    
    // Save to MongoDB
    const result = await db.collection('orders').insertOne(orderData);
    
    if (!result.acknowledged) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
    
    // Get the created order with its ID
    const order = {
      _id: result.insertedId.toString(),
      ...orderData
    };
    
    console.log("Order saved to MongoDB successfully");

    return NextResponse.json(
      {
        message: "Order created successfully",
        orderId: result.insertedId.toString(),
        trackingNumber,
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
