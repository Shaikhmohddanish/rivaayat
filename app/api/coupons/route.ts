import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import type { Coupon } from "@/lib/types"

// GET /api/coupons?code=XYZ - Public endpoint to validate coupon
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
    }

    const db = await getDatabase()

    const coupon = await db.collection<Coupon>("coupons").findOne({ code: code.toUpperCase() })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "Coupon is not active" }, { status: 400 })
    }

    return NextResponse.json({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
    })
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 })
  }
}

// POST /api/coupons - Admin only endpoint to create coupon
export async function POST(request: NextRequest) {
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

    if (!code || typeof discountPercent !== "number") {
      return NextResponse.json({ error: "Code and discountPercent are required" }, { status: 400 })
    }

    if (discountPercent < 0 || discountPercent > 100) {
      return NextResponse.json({ error: "Discount percent must be between 0 and 100" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if coupon code already exists
    const existingCoupon = await db.collection<Coupon>("coupons").findOne({ code: code.toUpperCase() })

    if (existingCoupon) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    }

    const newCoupon: Coupon = {
      code: code.toUpperCase(),
      discountPercent,
      isActive: isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<Coupon>("coupons").insertOne(newCoupon)

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        ...newCoupon,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}
