import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export interface Category {
  _id?: string
  name: string
  slug: string
  description?: string
  image?: string
}

// GET /api/categories - Public endpoint to get all categories
export async function GET() {
  try {
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
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
