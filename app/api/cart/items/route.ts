import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"
import { ObjectId } from "mongodb"

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

    // 🚀 OPTIMIZATION: Parallel fetch product and cart
    const [product, cart] = await Promise.all([
      db.collection('products').findOne({ _id: new ObjectId(productId) }),
      db.collection('carts').findOne({ userId: user.id })
    ])

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Find the specific variant
    const productVariant = product.variations?.variants?.find(
      (v: any) => v.color === variant.color && v.size === variant.size
    )

    if (!productVariant) {
      return NextResponse.json({ 
        error: "Variant not found" 
      }, { status: 404 })
    }

    // Check if requested quantity is available
    if (productVariant.stock < quantity) {
      return NextResponse.json({ 
        error: "Insufficient stock",
        availableStock: productVariant.stock,
        requestedQuantity: quantity
      }, { status: 400 })
    }
    
    const items = cart?.items || []

    // Find existing item with same product and variant
    const existingIndex = items.findIndex(
      (item: CartItem) =>
        item.productId === productId && item.variant.color === variant.color && item.variant.size === variant.size,
    )

    if (existingIndex > -1) {
      // Update quantity (check against stock again for existing items)
      const newQuantity = items[existingIndex].quantity + quantity
      if (productVariant.stock < newQuantity) {
        return NextResponse.json({ 
          error: "Insufficient stock for requested quantity",
          availableStock: productVariant.stock,
          currentInCart: items[existingIndex].quantity,
          requestedTotal: newQuantity
        }, { status: 400 })
      }
      items[existingIndex].quantity = newQuantity
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
    await db.collection('carts').updateOne(
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
