import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import type { Order } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "100")
    const skip = parseInt(searchParams.get("skip") || "0")
    const status = searchParams.get("status")
    
    const db = await getDatabase()
    const collection = db.collection<Order>("orders")
    
    // Build query
    const query: any = {}
    if (status && status !== "all") {
      query.status = status
    }
    
    // Get total count for pagination
    const total = await collection.countDocuments(query)
    
    // Fetch orders with pagination
    const orders = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      orders: orders.map((order) => ({
        ...order,
        _id: order._id?.toString(),
      })),
      total,
      limit,
      skip
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 })
  }
}
