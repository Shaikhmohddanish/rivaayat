import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { cartDb } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { productId, name, price, variant, quantity, image } = await request.json()

    if (!productId || !name || !price || !variant?.color || !variant?.size || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cart = await cartDb.findByUserId(user.id)
    const items = cart?.items || []

    // Find existing item with same product and variant
    const existingIndex = items.findIndex(
      (item) =>
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

    const updatedCart = await cartDb.upsert(user.id, items)

    return NextResponse.json({
      message: "Cart updated",
      items: updatedCart.items,
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

    await cartDb.deleteItem(user.id, productId, variant)

    const cart = await cartDb.findByUserId(user.id)

    return NextResponse.json({
      message: "Item removed",
      items: cart?.items || [],
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Remove from cart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
