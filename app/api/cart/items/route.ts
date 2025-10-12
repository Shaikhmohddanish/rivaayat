import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"

interface CartItem {
  productId: string
  name: string
  price: number
  variant: {
    color: string
    size: string
  }
  quantity: number
  image?: string
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { productId, name, price, variant, quantity, image } = await request.json()

    if (!productId || !name || !price || !variant?.color || !variant?.size || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Find existing cart or create a new one
    const cart = await db.collection('carts').findOne({ userId: user.id })
    const items = cart?.items || []

    // Find existing item with same product and variant
    const existingIndex = items.findIndex(
      (item: CartItem) =>
        item.productId === productId && item.variant.color === variant.color && item.variant.size === variant.size,
    )

    if (existingIndex > -1) {
      // Update quantity
      items[existingIndex].quantity = quantity
    } else {
      // Add new item
      items.push({
        productId,
        name,
        price,
        variant,
        quantity,
        image,
      })
    }

    // Upsert the cart
    const result = await db.collection('carts').updateOne(
      { userId: user.id },
      { 
        $set: { 
          items: items,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      message: "Cart updated",
      items: items,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Add to cart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth()
    const { productId, variant } = await request.json()

    if (!productId || !variant?.color || !variant?.size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    // Get the current cart
    const cart = await db.collection('carts').findOne({ userId: user.id })
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }
    
    // Filter out the item to be deleted
    const updatedItems = cart.items.filter(
      (item: CartItem) =>
        !(item.productId === productId && 
          item.variant.color === variant.color && 
          item.variant.size === variant.size)
    )
    
    // Update the cart
    await db.collection('carts').updateOne(
      { userId: user.id },
      { 
        $set: { 
          items: updatedItems,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      message: "Item removed",
      items: updatedItems || [],
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Remove from cart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
