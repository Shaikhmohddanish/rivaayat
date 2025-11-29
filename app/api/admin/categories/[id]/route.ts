import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Category } from "../route"

// DELETE /api/admin/categories/[id] - Delete a category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const db = await getDatabase()
    
    const result = await db.collection<Category>("categories").deleteOne({
      _id: new ObjectId(id) as any,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error: any) {
    console.error("Delete category error:", error)
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/categories/[id] - Update a category
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await request.json()
    const { name, slug, description, image } = body

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Check if slug already exists on a different category
    const existing = await db.collection<Category>("categories").findOne({ 
      slug, 
      _id: { $ne: new ObjectId(id) as any }
    })
    if (existing) {
      return NextResponse.json({ error: "Category with this slug already exists" }, { status: 400 })
    }

    const result = await db.collection<Category>("categories").updateOne(
      { _id: new ObjectId(id) as any },
      {
        $set: {
          name,
          slug,
          description: description || "",
          image: image || undefined,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Category updated successfully" })
  } catch (error: any) {
    console.error("Update category error:", error)
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
