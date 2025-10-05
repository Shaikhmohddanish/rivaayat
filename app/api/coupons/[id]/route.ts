import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Coupon } from "@/lib/types"

// PATCH /api/coupons/[id] - Admin only endpoint to update coupon
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { code, discountPercent, isActive } = body

    const updateFields: Partial<Coupon> = {
      updatedAt: new Date(),
    }

    if (code !== undefined) {
      updateFields.code = code.toUpperCase()
    }

    if (discountPercent !== undefined) {
      if (typeof discountPercent !== "number" || discountPercent < 0 || discountPercent > 100) {
        return NextResponse.json({ error: "Discount percent must be between 0 and 100" }, { status: 400 })
      }
      updateFields.discountPercent = discountPercent
    }

    if (isActive !== undefined) {
      updateFields.isActive = isActive
    }

    const client = await clientPromise
    const db = client.db("rivaayat")

    // If updating code, check if new code already exists
    if (code) {
      const existingCoupon = await db.collection<Coupon>("coupons").findOne({
        code: code.toUpperCase(),
        _id: { $ne: new ObjectId(params.id) },
      })

      if (existingCoupon) {
        return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
      }
    }

    const result = await db
      .collection<Coupon>("coupons")
      .findOneAndUpdate({ _id: new ObjectId(params.id) }, { $set: updateFields }, { returnDocument: "after" })

    if (!result) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({
      _id: result._id.toString(),
      code: result.code,
      discountPercent: result.discountPercent,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    })
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
  }
}
