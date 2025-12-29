import type Razorpay from "razorpay"
import type { Orders } from "razorpay/dist/types/orders"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { OrderValidationError, prepareOrderPricing } from "@/lib/order-service"
import { DEFAULT_MAX_ONLINE_PAYMENT_AMOUNT, RAZORPAY_ORDER_AMOUNT_HARD_LIMIT } from "@/lib/payment-limits"
import { getRazorpayClient } from "@/lib/razorpay"
import { getSiteSettings } from "@/lib/site-settings"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { items, coupon, shippingAddress } = await request.json()

    const { subtotal, discountAmount, shipping, total, validatedCoupon } = await prepareOrderPricing(items, coupon)

    const razorpay = getRazorpayClient()
    const amountInPaise = Math.round(Number(total) * 100)

    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      throw new OrderValidationError("Calculated order total is invalid", 422)
    }

    const siteSettings = await getSiteSettings()
    const configuredLimit = siteSettings.maxOnlinePaymentAmount ?? DEFAULT_MAX_ONLINE_PAYMENT_AMOUNT
    const maxLimitInInr = Math.min(configuredLimit, RAZORPAY_ORDER_AMOUNT_HARD_LIMIT)
    const maxAmountInPaise = Math.round(maxLimitInInr * 100)

    if (amountInPaise > maxAmountInPaise) {
      throw new OrderValidationError(
        `Order total exceeds online payment limit of ₹${maxLimitInInr.toLocaleString()}.
Please reduce cart value or contact support for a custom payment link.`,
        400,
      )
    }
    const orderParams: Orders.RazorpayOrderCreateRequestBody = {
      amount: amountInPaise,
      currency: "INR",
      payment: {
        capture: "automatic",
      },
      receipt: `riv-${Date.now()}`,
      notes: {
        userId: user.id,
        email: shippingAddress?.email || "",
      },
    }

    const razorpayOrder: Orders.RazorpayOrder = await razorpay.orders.create(orderParams)

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subtotal,
      discountAmount,
      shipping,
      total,
      coupon: validatedCoupon,
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

    console.error("Razorpay order creation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create Razorpay order" }, { status: 500 })
  }
}
