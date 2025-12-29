import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import type { Order, User } from "@/lib/types"

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

    const userIds = Array.from(new Set(
      orders
        .map((order) => {
          if (!order.userId) return null
          if (typeof order.userId === "string") return order.userId
          const possibleId = (order.userId as unknown as { toString?: () => string })?.toString?.()
          return possibleId || null
        })
        .filter((value): value is string => Boolean(value))
    ))

    let userMap = new Map<string, { _id: string; name?: string; email?: string }>()

    if (userIds.length > 0) {
      const validObjectIds = userIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id))

      if (validObjectIds.length > 0) {
        const users = await db
          .collection<User>("users")
          .find({ _id: { $in: validObjectIds } })
          .project({ password: 0 })
          .toArray()

        userMap = new Map(
          users
            .map((user) => {
              const userId = user._id?.toString()
              if (!userId) return null
              return [userId, { _id: userId, name: user.name, email: user.email }]
            })
            .filter((entry): entry is [string, { _id: string; name?: string; email?: string }] => Boolean(entry))
        )
      }
    }

    const ordersWithUsers = orders.map((order) => {
      const normalizedUserId = typeof order.userId === "string"
        ? order.userId
        : (order.userId as unknown as { toString?: () => string })?.toString?.()

      return {
        ...order,
        _id: order._id?.toString(),
        userId: normalizedUserId ?? order.userId,
        user: normalizedUserId ? userMap.get(normalizedUserId) ?? null : null,
      }
    })

    return NextResponse.json({
      orders: ordersWithUsers,
      total,
      limit,
      skip
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 })
  }
}
