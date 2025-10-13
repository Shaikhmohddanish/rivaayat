"use server"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb-safe"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
    
    const couponsCollection = db.collection("coupons")

    // Find the coupon by code (case insensitive)
    const coupon = await couponsCollection.findOne({
      code: { $regex: new RegExp(`^${code}$`, "i") },
      isActive: true,
      expiryDate: { $gt: new Date() } // Check if coupon hasn't expired
    })

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 404 })
    }

    // Check if user has already used this coupon if it's single-use
    if (coupon.singleUse) {
      const ordersCollection = db.collection("orders")
      // Check if session.user.id is a valid ObjectId
      let userId;
      try {
        userId = new ObjectId(session.user.id);
      } catch (error) {
        userId = session.user.id;
      }
      
      const orderWithCoupon = await ordersCollection.findOne({
        userId: userId,
        "coupon.code": coupon.code
      })

      if (orderWithCoupon) {
        return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 })
      }
    }

    // Return coupon details for application
    return NextResponse.json({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      minOrderValue: coupon.minOrderValue || 0
    })
  } catch (error: any) {
    console.error("Error validating coupon:", error)
    return NextResponse.json({ error: error.message || "Failed to validate coupon" }, { status: 500 })
  }
}