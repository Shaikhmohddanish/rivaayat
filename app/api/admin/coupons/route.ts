import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import type { Coupon } from "@/lib/types"

export async function GET() {
  try {
    await requireAdmin()
    const db = await getDatabase()
    const coupons = await db.collection<Coupon>("coupons").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(
      coupons.map((coupon) => ({
        ...coupon,
        _id: coupon._id?.toString(),
      })),
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const db = await getDatabase()

    // Check if coupon code already exists
    const existing = await db.collection("coupons").findOne({ code: body.code })
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    }

    const coupon: Coupon = {
      code: body.code.toUpperCase(),
      discountPercent: body.discountPercent,
      isActive: body.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("coupons").insertOne(coupon)

    return NextResponse.json({ _id: result.insertedId.toString(), ...coupon })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 })
  }
}
