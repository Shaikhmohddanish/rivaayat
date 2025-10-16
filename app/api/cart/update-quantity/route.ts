import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"
import { ObjectId } from "mongodb"

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    const { productId, variant, quantity } = await request.json()

    if (!productId || !variant?.color || !variant?.size || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Fetch product and cart in parallel
    const [product, cart] = await Promise.all([
      db.collection('products').findOne({ _id: new ObjectId(productId) }),
      db.collection('carts').findOne({ userId: user.id })
    ])

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Find the specific variant and check stock
    const productVariant = product.variations?.variants?.find(
      (v: any) => v.color === variant.color && v.size === variant.size
    )

    if (!productVariant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    // Check stock availability
    if (productVariant.stock < quantity) {
      return NextResponse.json({ 
        error: "Insufficient stock",
        availableStock: productVariant.stock,
        requestedQuantity: quantity
      }, { status: 400 })
    }

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    const items = cart.items || []
    
    // Find the item to update
    const itemIndex = items.findIndex(
      (item: any) =>
        item.productId === productId && 
        item.variant.color === variant.color && 
        item.variant.size === variant.size
    )

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 })
    }

    // Update the quantity
    items[itemIndex].quantity = quantity

    // Update the cart in database
    await db.collection('carts').updateOne(
      { userId: user.id },
      { 
        $set: { 
          items: items,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ 
      success: true,
      items: items
    })
  } catch (error) {
    console.error("Error updating cart quantity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
