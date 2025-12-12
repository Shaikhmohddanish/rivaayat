import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import clientPromise from "@/lib/mongodb-safe"
import type { Product } from "@/lib/types"

// GET /api/admin/products - Admin only endpoint to list all products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const client = await clientPromise
    if (!client) throw new Error("Failed to connect to database")
    const db = client.db("rivaayat")

    const products = await db.collection<Product>("products").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(
      products.map((product) => ({
        ...product,
        _id: product._id?.toString(),
      })),
    )
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST /api/admin/products - Admin only endpoint to create product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, images, price, category, isFeatured, isActive, isDraft, variations } = body

    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    // If not a draft, validate required fields
    if (!isDraft && (!slug || !description || !price || !images || !variations)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Enhanced slug validation and handling
    let finalSlug = slug ? slug.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') : `draft-${Date.now()}`
    
    const client = await clientPromise
    if (!client) throw new Error("Failed to connect to database")
    const db = client.db("rivaayat")

    // Check if slug already exists, if it does, make it unique with a timestamp
    const existingProduct = await db.collection<Product>("products").findOne({ slug: finalSlug })

    if (existingProduct) {
      const timestamp = Date.now().toString().slice(-5)
      finalSlug = `${finalSlug}-${timestamp}`
    }

    // Create product without _id, MongoDB will generate one
    const productData = {
      name,
      slug: finalSlug, // Use our guaranteed unique slug
      description: description || "",
      images: images || [],
      price: price || 0,
      category: category || undefined,
      isFeatured: isFeatured ?? false,
      isActive: isActive ?? true,
      isDraft: isDraft ?? false,
      variations: variations || { colors: [], sizes: [], variants: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<Product>("products").insertOne(productData as any)

    // Add the generated _id to create the complete product
    const newProduct: Product = {
      _id: result.insertedId.toString(),
      ...productData
    }

    return NextResponse.json(
      newProduct,
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
