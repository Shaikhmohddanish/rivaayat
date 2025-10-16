import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/types"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDatabase()
    
    let product: any = null

    // Try to fetch by ObjectId first
    if (ObjectId.isValid(id)) {
      console.log(`Fetching product by ID: ${id}`)
      product = await db.collection<Product>("products").findOne({ 
        _id: new ObjectId(id) as any 
      })
    }
    
    // If not found or invalid ObjectId, try by slug
    if (!product) {
      console.log(`Fetching product by slug: ${id}`)
      product = await db.collection<Product>("products").findOne({ 
        slug: id 
      })
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const formattedProduct = {
      ...product,
      _id: product._id?.toString(),
    }

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
