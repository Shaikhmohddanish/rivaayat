import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import clientPromise from "@/lib/mongodb-safe"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/types"

// GET /api/admin/products/[id] - Admin only endpoint to get single product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    
    // Handle "new" case - return empty product template
    if (id === "new") {
      return NextResponse.json({
        _id: null,
        name: "",
        slug: "",
        description: "",
        images: [],
        price: 0,
        isFeatured: false,
        variations: []
      })
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }
    
    const client = await clientPromise
    if (!client) throw new Error("Failed to connect to database")
    const db = client.db("rivaayat")

    const product = await db.collection<Product>("products").findOne({ _id: new ObjectId(id) as any })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...product,
      _id: product._id?.toString(),
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PATCH /api/admin/products/[id] - Admin only endpoint to update product
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, images, price, category, isFeatured, variations } = body

    const updateFields: Partial<Product> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateFields.name = name
    if (category !== undefined) updateFields.category = category || undefined
    if (slug !== undefined) {
      // Check if new slug already exists on a different product
      const { id } = await params
      
      const client = await clientPromise
      if (!client) throw new Error("Failed to connect to database")
      const db = client.db("rivaayat")
      const existingProduct = await db.collection<Product>("products").findOne({
        slug,
        _id: { $ne: new ObjectId(id) as any },
      })

      if (existingProduct) {
        return NextResponse.json({ error: "Product with this slug already exists" }, { status: 400 })
      }

      updateFields.slug = slug
    }
    if (description !== undefined) updateFields.description = description
    if (images !== undefined) updateFields.images = images
    if (price !== undefined) updateFields.price = price
    if (isFeatured !== undefined) updateFields.isFeatured = isFeatured
    if (variations !== undefined) updateFields.variations = variations

    const client = await clientPromise
    if (!client) throw new Error("Failed to connect to database")
    const db = client.db("rivaayat")

    const result = await db
      .collection<Product>("products")
      .findOneAndUpdate({ _id: new ObjectId(id) as any }, { $set: updateFields }, { returnDocument: "after" })

    if (!result) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...result,
      _id: result._id?.toString(),
    })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}
