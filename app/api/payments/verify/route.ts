import crypto from "crypto"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { OrderValidationError, finalizeOrder, prepareOrderPricing } from "@/lib/order-service"
import { createPaymentRecord } from "@/lib/payment-service"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const {
      items,
      coupon,
      shippingAddress,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    } = await request.json()

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing Razorpay payment details" }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET

    if (!secret) {
      return NextResponse.json({ error: "Server payment configuration missing" }, { status: 500 })
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex")

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const { subtotal, discountAmount, shipping, total, validatedCoupon, bulkOps, db } = await prepareOrderPricing(items, coupon)

    const payment = {
      provider: "razorpay" as const,
      status: "paid" as const,
      amount: total,
      currency: "INR",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      method: paymentMethod || "online",
    }

    const { orderId, trackingNumber, order } = await finalizeOrder({
      userId: user.id,
      items,
      shippingAddress,
      coupon: validatedCoupon,
      bulkOps,
      db,
      payment,
    })

    await createPaymentRecord({
      userId: user.id,
      orderId,
      provider: "razorpay",
      status: "paid",
      amount: payment.amount,
      currency: payment.currency,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      method: payment.method,
      metadata: {
        subtotal,
        discountAmount,
        shipping,
        total,
        coupon: validatedCoupon?.code,
      },
    })

    return NextResponse.json({
      message: "Payment verified and order created",
      orderId,
      trackingNumber,
      order,
      totals: {
        subtotal,
        discountAmount,
        shipping,
        total,
      },
    })
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      )
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
