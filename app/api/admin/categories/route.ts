import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"

export interface Category {
  _id?: string
  name: string
  slug: string
  description?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

// GET /api/admin/categories - Get all categories
export async function GET() {
  try {
    await requireAdmin()

    const db = await getDatabase()
    const categories = await db.collection<Category>("categories")
      .find({})
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json(
      categories.map((cat) => ({
        ...cat,
        _id: cat._id?.toString(),
      }))
    )
  } catch (error: any) {
    console.error("Get categories error:", error)
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/categories - Create a new category
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, slug, description, image } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Check if slug already exists
    const existing = await db.collection<Category>("categories").findOne({ slug })
    if (existing) {
      return NextResponse.json({ error: "Category with this slug already exists" }, { status: 400 })
    }

    const result = await db.collection<Category>("categories").insertOne({
      name,
      slug,
      description: description || "",
      image: image || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Category created successfully",
        categoryId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create category error:", error)
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
