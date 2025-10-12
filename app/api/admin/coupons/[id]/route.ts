import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireAdmin()
    const body = await request.json()
    const db = await getDatabase()

    const updateData: any = { updatedAt: new Date() }
    if (body.code !== undefined) updateData.code = body.code.toUpperCase()
    if (body.discountPercent !== undefined) updateData.discountPercent = body.discountPercent
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const result = await db.collection("coupons").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 })
  }
}
