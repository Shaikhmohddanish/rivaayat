import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
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
    const { name, slug, description, images, price, isFeatured, variations } = body

    if (!name || !slug || !description || !price || !images || !variations) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("rivaayat")

    // Check if slug already exists
    const existingProduct = await db.collection<Product>("products").findOne({ slug })

    if (existingProduct) {
      return NextResponse.json({ error: "Product with this slug already exists" }, { status: 400 })
    }

    const newProduct: Product = {
      name,
      slug,
      description,
      images,
      price,
      isFeatured: isFeatured ?? false,
      variations,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<Product>("products").insertOne(newProduct)

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        ...newProduct,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
