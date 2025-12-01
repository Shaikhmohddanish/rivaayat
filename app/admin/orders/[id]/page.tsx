"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UpdateOrderTracking } from "@/components/update-order-tracking"
import { formatDateTimeIST } from "@/lib/date-utils"
import type { Order } from "@/lib/types"
import { ArrowLeft, Calendar, CreditCard, Loader2, Mail, MapPin, Phone, User } from "lucide-react"

const statusStyles: Record<Order["status"], string> = {
  placed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  out_for_delivery: "bg-orange-100 text-orange-800 border-orange-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

const paymentStatusStyles = (status: NonNullable<Order["payment"]>["status"]) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 border border-green-200"
    case "failed":
      return "bg-red-100 text-red-800 border border-red-200"
    default:
      return "bg-yellow-100 text-yellow-800 border border-yellow-200"
  }
}

const paymentStatusLabel = (status: NonNullable<Order["payment"]>["status"]) => {
  switch (status) {
    case "paid":
      return "Paid"
    case "failed":
      return "Failed"
    default:
      return "Pending"
  }
}

export default function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { id: orderId } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const isAdmin = session?.user?.role === "admin"

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch order")
      }

      setOrder(data.order)
    } catch (err) {
      console.error("Admin order fetch error:", err)
      setError(err instanceof Error ? err.message : "Unable to load order")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/login")
      return
    }

    if (!isAdmin) {
      router.push("/")
      return
    }

    if (orderId) {
      fetchOrder()
    }
  }, [session, status, isAdmin, orderId, router, fetchOrder])

  const subtotal = order?.items.reduce((total, item) => total + item.price * item.quantity, 0) ?? 0
  const discount = order?.coupon ? subtotal * (order.coupon.discountPercent / 100) : 0
  const total = subtotal - discount

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading order...</span>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-8">
              <p className="text-lg font-semibold mb-2">{error || "Order not found"}</p>
              <p className="text-muted-foreground mb-4">There was a problem loading this order.</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={fetchOrder}>Try Again</Button>
                <Button asChild>
                  <Link href="/admin/orders">Back to Orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild className="w-fit">
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Order #{order._id?.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-muted-foreground">
                Placed on {formatDateTimeIST(order.createdAt)}
              </p>
              {order.trackingNumber && (
                <p className="text-xs font-mono mt-1 text-muted-foreground">
                  Tracking: {order.trackingNumber}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Badge className={`${statusStyles[order.status]} capitalize px-3 py-1 border`}>
                {order.status === "out_for_delivery" ? "Out for Delivery" : order.status}
              </Badge>
              <UpdateOrderTracking
                orderId={order._id ?? orderId}
                currentStatus={order.status}
                onStatusUpdated={fetchOrder}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b last:border-0 pb-4 last:pb-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.variant.color} • {item.variant.size} • Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tracking Information</CardTitle>
              </CardHeader>
              <CardContent>
                {order.tracking?.trackingId ? (
                  <div className="space-y-2 text-sm">
                    {order.tracking.carrier && (
                      <p>
                        <span className="font-semibold">Carrier:</span> {order.tracking.carrier}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Tracking ID:</span> {order.tracking.trackingId}
                    </p>
                    {order.tracking.notes && (
                      <p className="text-muted-foreground">{order.tracking.notes}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tracking details provided yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {order.coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({order.coupon.code})</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer & Shipping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.shippingAddress?.fullName}</span>
                </div>
                {order.shippingAddress?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shippingAddress.email}</span>
                  </div>
                )}
                {order.shippingAddress?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-1" />
                  <div>
                    {order.shippingAddress?.addressLine1 && <p>{order.shippingAddress.addressLine1}</p>}
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>
                      {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p>{order.shippingAddress?.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {order.updatedAt ? formatDateTimeIST(order.updatedAt) : formatDateTimeIST(order.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {order.payment ? (
                  <>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${paymentStatusStyles(order.payment.status)}`}>
                      {paymentStatusLabel(order.payment.status)}
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-base">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        ₹{(order.payment.amount ?? total).toFixed(2)} {order.payment.currency}
                      </span>
                    </div>
                    <p className="text-muted-foreground capitalize">Method: {order.payment.method || "online"}</p>
                    {order.payment.razorpayPaymentId && (
                      <p className="text-xs font-mono break-all">
                        Payment ID: {order.payment.razorpayPaymentId}
                      </p>
                    )}
                    {order.payment.razorpayOrderId && (
                      <p className="text-xs font-mono break-all">
                        Razorpay Order: {order.payment.razorpayOrderId}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No payment information recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
