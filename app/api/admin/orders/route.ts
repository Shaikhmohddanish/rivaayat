import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import type { Order } from "@/lib/types"

export async function GET() {
  try {
    await requireAdmin()
    const db = await getDatabase()
    const orders = await db.collection<Order>("orders").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(
      orders.map((order) => ({
        ...order,
        _id: order._id?.toString(),
      })),
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 })
  }
}
