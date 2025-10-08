import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/types"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    console.log(`Fetching product ${id} from database`)
    const db = await getDatabase()
    const product = await db.collection<Product>("products").findOne({ 
      _id: new ObjectId(id) as any 
    })

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
