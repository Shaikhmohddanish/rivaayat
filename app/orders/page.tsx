"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShimmerHeading, ShimmerText, ShimmerOrderCard } from "@/components/ui/shimmer"
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, CreditCard } from "lucide-react"
import { formatDateTimeIST } from "@/lib/date-utils"
import type { Order } from "@/lib/types"

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/login")
      return
    }

    fetchOrders()
  }, [session, status, router])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/orders")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders")
      }

      setOrders(data.orders || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError(error instanceof Error ? error.message : "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "placed":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "out_for_delivery":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "placed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "out_for_delivery":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const calculateTotal = (order: Order) => {
    const itemsTotal = order.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
    
    if (order.coupon) {
      const discount = itemsTotal * (order.coupon.discountPercent / 100)
      return itemsTotal - discount
    }
    
    return itemsTotal
  }

  type PaymentStatus = NonNullable<Order["payment"]>["status"]

  const getPaymentBadgeColor = (status?: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border border-green-200"
      case "failed":
        return "bg-red-100 text-red-800 border border-red-200"
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Shimmer */}
            <div className="mb-8 space-y-3">
              <ShimmerHeading className="w-32 sm:w-52" />
              <ShimmerText className="w-48 sm:w-72" />
            </div>

            {/* Orders Shimmer */}
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden elegant-shadow">
                  <CardHeader className="bg-muted/30">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-2 flex-1">
                          <div className="h-5 sm:h-6 w-32 sm:w-40 rounded shimmer" />
                          <div className="h-4 w-24 sm:w-32 rounded shimmer" />
                        </div>
                        <div className="h-6 w-20 rounded-full shimmer shrink-0" />
                      </div>
                      <div className="h-9 w-full rounded shimmer" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Item Shimmer */}
                      <div className="space-y-3">
                        {[1, 2].map((j) => (
                          <div key={j} className="flex items-start gap-3">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg shimmer-card shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 sm:h-5 w-full sm:w-3/4 rounded shimmer" />
                              <div className="flex gap-2">
                                <div className="h-3 sm:h-4 w-16 sm:w-20 rounded shimmer" />
                                <div className="h-3 sm:h-4 w-12 sm:w-16 rounded shimmer" />
                                <div className="h-3 sm:h-4 w-12 sm:w-16 rounded shimmer" />
                              </div>
                              <div className="sm:hidden space-y-1">
                                <div className="h-4 w-20 rounded shimmer" />
                                <div className="h-3 w-24 rounded shimmer" />
                              </div>
                            </div>
                            <div className="hidden sm:block space-y-1 shrink-0">
                              <div className="h-5 w-20 rounded shimmer" />
                              <div className="h-4 w-24 rounded shimmer" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4" />
                      {/* Summary Shimmer */}
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <div className="h-4 w-16 sm:w-20 rounded shimmer" />
                          <div className="h-4 w-24 sm:w-32 rounded shimmer" />
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="h-5 sm:h-6 w-20 sm:w-24 rounded shimmer ml-auto" />
                          <div className="h-4 w-12 rounded shimmer ml-auto" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error Loading Orders</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchOrders} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 elegant-gradient bg-clip-text text-transparent">
              My Orders
            </h1>
            <p className="text-muted-foreground">
              Track and manage your dress orders • All dates shown in dd/mm/yyyy format (IST)
            </p>
          </div>

          {orders.length === 0 ? (
            <Card className="text-center py-12 elegant-shadow">
              <CardContent>
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
                <p className="text-muted-foreground mb-6">
                  You haven't placed any orders yet. Start shopping for beautiful dresses!
                </p>
                <Button asChild className="elegant-gradient text-white">
                  <Link href="/shop">Browse Dresses</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order._id} className="overflow-hidden elegant-shadow hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-muted/30">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg break-all">
                            Order #{order._id?.slice(-8).toUpperCase()}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatDateTimeIST(order.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(order.status)} capitalize text-xs`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status === "out_for_delivery" ? "Out for Delivery" : order.status}</span>
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="elegant-hover w-full justify-start"
                      >
                        <Link href={`/orders/${order._id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                              <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="font-medium text-sm sm:text-base line-clamp-2">{item.name}</h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                                <span className="whitespace-nowrap">Color: {item.variant.color}</span>
                                <span className="whitespace-nowrap">Size: {item.variant.size}</span>
                                <span className="whitespace-nowrap">Qty: {item.quantity}</span>
                              </div>
                              <div className="sm:hidden">
                                <p className="font-semibold text-sm">₹{item.price.toFixed(2)}</p>
                                {item.quantity > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    ₹{(item.price * item.quantity).toFixed(2)} total
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="hidden sm:block text-right shrink-0">
                              <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  ₹{(item.price * item.quantity).toFixed(2)} total
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Order Summary */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                          {order.coupon && (
                            <p className="text-xs sm:text-sm text-green-600 truncate">
                              {order.coupon.discountPercent}% off with {order.coupon.code}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base sm:text-lg font-bold">
                            ₹{calculateTotal(order).toFixed(2)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                        </div>
                      </div>

                      {order.payment && (
                        <div className="bg-muted/40 rounded-lg p-3 sm:p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="flex items-center gap-2 font-medium">
                              <CreditCard className="h-4 w-4" /> Payment
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${getPaymentBadgeColor(order.payment.status)}`}>
                              {order.payment.status === "paid" ? "Paid" : order.payment.status === "failed" ? "Failed" : "Pending"}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground flex flex-col gap-1">
                            <span>
                              Amount: <span className="font-semibold text-foreground">₹{(order.payment.amount ?? calculateTotal(order)).toFixed(2)}</span>
                            </span>
                            <span>
                              Method: {order.payment.method ? order.payment.method.replace(/_/g, " ") : "Online"}
                            </span>
                            {order.payment.razorpayPaymentId && (
                              <span className="break-all">Payment ID: {order.payment.razorpayPaymentId}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tracking Info */}
                      {order.tracking && (
                        <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                          <h5 className="font-medium mb-2 text-sm sm:text-base">Tracking Information</h5>
                          <div className="space-y-1 text-xs sm:text-sm">
                            {order.tracking.carrier && (
                              <p className="wrap-break-word"><span className="font-medium">Carrier:</span> {order.tracking.carrier}</p>
                            )}
                            {order.tracking.trackingId && (
                              <p className="break-all font-mono text-xs sm:text-sm"><span className="font-sans font-medium">Tracking:</span> {order.tracking.trackingId}</p>
                            )}
                            {order.tracking.notes && (
                              <p className="text-muted-foreground wrap-break-word">{order.tracking.notes}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}