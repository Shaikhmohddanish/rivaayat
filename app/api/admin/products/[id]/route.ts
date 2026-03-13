import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import clientPromise from "@/lib/mongodb-safe"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/types"

function parseProductImages(images: unknown): Product["images"] | null {
  if (!Array.isArray(images)) return null

  const normalized: Product["images"] = []
  for (let i = 0; i < images.length; i++) {
    const item = images[i]
    if (!item || typeof item !== "object") return null

    const image = item as { publicId?: unknown; url?: unknown; sortOrder?: unknown }
    if (typeof image.publicId !== "string" || image.publicId.trim() === "") return null
    if (typeof image.url !== "string" || image.url.trim() === "") return null

    normalized.push({
      publicId: image.publicId,
      url: image.url,
      sortOrder: Number.isFinite(Number(image.sortOrder)) ? Number(image.sortOrder) : i,
    })
  }

  return normalized
}

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
        originalPrice: 0,
        discountedPrice: 0,
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const productId = new ObjectId(id)
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      images,
      price,
      originalPrice,
      discountedPrice,
      category,
      isFeatured,
      isActive,
      isDraft,
      variations,
    } = body
    const parsedImages = images !== undefined ? parseProductImages(images) : undefined

    const client = await clientPromise
    if (!client) throw new Error("Failed to connect to database")
    const db = client.db("rivaayat")

    const existingProduct = await db.collection<Product>("products").findOne({ _id: productId as any })
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (parsedImages === null) {
      return NextResponse.json({ error: "Invalid images format" }, { status: 400 })
    }

    const nextIsDraft = isDraft !== undefined ? Boolean(isDraft) : Boolean(existingProduct.isDraft)
    const nextImages = parsedImages !== undefined ? parsedImages : existingProduct.images || []
    if (!nextIsDraft && nextImages.length === 0) {
      return NextResponse.json({ error: "At least one valid product image is required" }, { status: 400 })
    }

    const updateFields: Partial<Product> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateFields.name = name
    if (category !== undefined) updateFields.category = category || undefined
    if (slug !== undefined) {
      // Check if new slug already exists on a different product
      const existingProductBySlug = await db.collection<Product>("products").findOne({
        slug,
        _id: { $ne: productId as any },
      })

      if (existingProductBySlug) {
        return NextResponse.json({ error: "Product with this slug already exists" }, { status: 400 })
      }

      updateFields.slug = slug
    }
    if (description !== undefined) updateFields.description = description
    if (images !== undefined) {
      updateFields.images = parsedImages
    }
    if (originalPrice !== undefined) {
      updateFields.originalPrice = originalPrice || undefined
    }
    if (discountedPrice !== undefined) {
      const normalizedDiscount = Number(discountedPrice)
      updateFields.discountedPrice = normalizedDiscount
      updateFields.price = normalizedDiscount
    } else if (price !== undefined) {
      updateFields.price = price
    }
    if (isFeatured !== undefined) updateFields.isFeatured = isFeatured
    if (isActive !== undefined) updateFields.isActive = isActive
    if (isDraft !== undefined) updateFields.isDraft = isDraft
    if (variations !== undefined) updateFields.variations = variations

    const result = await db
      .collection<Product>("products")
      .findOneAndUpdate({ _id: productId as any }, { $set: updateFields }, { returnDocument: "after" })

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

// DELETE /api/admin/products/[id] - Admin only endpoint to delete product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const client = await clientPromise
    if (!client) throw new Error("Failed to connect to database")
    const db = client.db("rivaayat")

    const result = await db.collection<Product>("products").deleteOne({ _id: new ObjectId(id) as any })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
