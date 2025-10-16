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

    // Get MongoDB connection
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // 🚀 OPTIMIZATION: Batch fetch all products in single query
    const productIds = items.map((item: any) => new ObjectId(item.productId))
    const products = await db.collection('products').find({ 
      _id: { $in: productIds } 
    }).toArray()

    // Create a map for quick product lookup
    const productMap = new Map(products.map(p => [p._id.toString(), p]))

    // Validate stock availability and prepare update operations
    const stockUpdates: any[] = []
    const insufficientStock: string[] = []
    const bulkOps: any[] = []

    for (const item of items) {
      // Get product from map (no DB query)
      const product = productMap.get(item.productId)

      if (!product) {
        return NextResponse.json({ 
          error: `Product "${item.name}" not found` 
        }, { status: 400 })
      }

      // Find the specific variant
      const variant = product.variations?.variants?.find(
        (v: any) => v.color === item.variant.color && v.size === item.variant.size
      )

      if (!variant) {
        return NextResponse.json({ 
          error: `Variant ${item.variant.color}/${item.variant.size} not found for "${item.name}"` 
        }, { status: 400 })
      }

      // Check if sufficient stock is available
      if (variant.stock < item.quantity) {
        insufficientStock.push(
          `${item.name} (${item.variant.color}/${item.variant.size}): Only ${variant.stock} available, but ${item.quantity} requested`
        )
      } else {
        // Prepare the stock update for bulkWrite
        bulkOps.push({
          updateOne: {
            filter: {
              _id: new ObjectId(item.productId),
              'variations.variants': {
                $elemMatch: {
                  color: item.variant.color,
                  size: item.variant.size
                }
              }
            },
            update: {
              $inc: {
                'variations.variants.$.stock': -item.quantity
              }
            }
          }
        })
      }
    }

    // If any item has insufficient stock, return error
    if (insufficientStock.length > 0) {
      return NextResponse.json({ 
        error: "Insufficient stock",
        details: insufficientStock
      }, { status: 400 })
    }

    // Generate a tracking number (format: RIV-YYYYMMDD-XXXX)
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const trackingNumber = `RIV-${dateStr}-${randomPart}`;
    
    // Create initial tracking status
    const initialTrackingStatus = {
      status: "order_confirmed" as const,
      timestamp: new Date(),
      message: "Your order has been confirmed and is being prepared for processing."
    };
    
    // Create the order object
    const orderData = {
      userId: user.id,
      items,
      status: "placed" as const,
      trackingNumber,
      trackingHistory: [initialTrackingStatus], // Initialize with order confirmed status
      shippingAddress,
      ...(coupon && { coupon }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Save order to MongoDB
    const result = await db.collection('orders').insertOne(orderData);
    
    if (!result.acknowledged) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // 🚀 OPTIMIZATION: Batch update all product stocks in single operation
    if (bulkOps.length > 0) {
      await db.collection('products').bulkWrite(bulkOps)
    }

    // Clear user's cart
    await db.collection('carts').deleteOne({ userId: user.id })
    
    // Get the created order with its ID
    const order = {
      _id: result.insertedId.toString(),
      ...orderData
    };
    
    console.log("Order saved to MongoDB successfully, stock updated, cart cleared");

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
