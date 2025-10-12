"use server"

import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/types"

// GET /api/admin/check-slug?slug=example-slug&productId=existing-id
export async function GET(request: Request) {
  try {
    // Ensure the user is an admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the slug and optional productId from query params
    const url = new URL(request.url)
    const slug = url.searchParams.get("slug")
    // productId is optional and only provided when editing an existing product
    const productId = url.searchParams.get("productId")
    
    if (!slug) {
      return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 })
    }

    // Check if slug already exists in the database (excluding the current product if editing)
    const db = await getDatabase()
    
    let existingProduct;
    
    if (productId) {
      // If we're editing a product, exclude the current product from the check
      existingProduct = await db.collection<Product>("products").findOne({
        slug,
        _id: { $ne: new ObjectId(productId) as any }
      });
    } else {
      // If creating a new product, check if the slug exists anywhere
      existingProduct = await db.collection<Product>("products").findOne({ slug });
    }
    const timestamp = Date.now().toString().slice(-5)

    return NextResponse.json({
      available: !existingProduct,
      originalSlug: slug,
      suggestedSlug: existingProduct ? `${slug}-${timestamp}` : slug
    })
  } catch (error) {
    console.error("Error checking slug availability:", error)
    return NextResponse.json({ error: "Failed to check slug availability" }, { status: 500 })
  }
}