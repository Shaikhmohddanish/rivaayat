"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, MapPin, Calendar, CreditCard } from "lucide-react"
import { formatDateTimeIST, formatDateDDMMYYYY } from "@/lib/date-utils"
import type { Order } from "@/lib/types"

const getTrackingStatusIcon = (status: string) => {
  switch (status) {
    case "order_confirmed":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "processing":
      return <Package className="h-5 w-5 text-blue-500" />
    case "shipped":
      return <Truck className="h-5 w-5 text-purple-500" />
    case "out_for_delivery":
      return <MapPin className="h-5 w-5 text-orange-500" />
    case "delivered":
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case "cancelled":
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />
  }
}

const getTrackingStatusLabel = (status: string) => {
  switch (status) {
    case "order_confirmed":
      return "Order Confirmed"
    case "processing":
      return "Processing"
    case "shipped":
      return "Shipped"
    case "out_for_delivery":
      return "Out for Delivery"
    case "delivered":
      return "Delivered"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
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

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id: orderId } = use(params)
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/login")
      return
    }

    if (orderId) {
      fetchOrder()
    }
  }, [session, status, router, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch order")
      }

      setOrder(data.order)
    } catch (error) {
      console.error("Error fetching order:", error)
      setError(error instanceof Error ? error.message : "Failed to load order")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "placed":
        return <Clock className="h-5 w-5" />
      case "processing":
        return <Package className="h-5 w-5" />
      case "shipped":
        return <Truck className="h-5 w-5" />
      case "delivered":
        return <CheckCircle className="h-5 w-5" />
      case "cancelled":
        return <XCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
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

  const getStatusSteps = (currentStatus: Order["status"]) => {
    const steps = [
      { status: "placed", label: "Order Placed", icon: <Clock className="h-4 w-4" /> },
      { status: "processing", label: "Processing", icon: <Package className="h-4 w-4" /> },
      { status: "shipped", label: "Shipped", icon: <Truck className="h-4 w-4" /> },
      { status: "out_for_delivery", label: "Out for Delivery", icon: <Truck className="h-4 w-4" /> },
      { status: "delivered", label: "Delivered", icon: <CheckCircle className="h-4 w-4" /> },
    ]

    if (currentStatus === "cancelled") {
      return [
        { status: "placed", label: "Order Placed", icon: <Clock className="h-4 w-4" />, completed: true, active: false },
        { status: "cancelled", label: "Cancelled", icon: <XCircle className="h-4 w-4" />, completed: true, active: true },
      ]
    }

    const currentIndex = steps.findIndex(step => step.status === currentStatus)
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }))
  }

  const calculateSubtotal = () => {
    if (!order) return 0
    return order.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const calculateDiscount = () => {
    if (!order?.coupon) return 0
    const subtotal = calculateSubtotal()
    return subtotal * (order.coupon.discountPercent / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Shimmer */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-8 sm:h-9 w-24 sm:w-32 rounded-xl shimmer"></div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="h-8 sm:h-10 w-48 sm:w-72 rounded-xl shimmer"></div>
                  <div className="h-4 sm:h-5 w-56 sm:w-96 rounded-lg shimmer"></div>
                  <div className="h-4 sm:h-5 w-40 sm:w-64 rounded-lg shimmer"></div>
                </div>
                <div className="h-8 sm:h-9 w-24 sm:w-32 rounded-full shimmer self-start"></div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content Shimmer */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Timeline Shimmer */}
                <Card className="elegant-shadow">
                  <CardHeader>
                    <div className="h-5 sm:h-6 w-32 sm:w-40 rounded-lg shimmer"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shimmer-card shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 sm:h-5 w-24 sm:w-32 rounded shimmer"></div>
                            <div className="h-3 w-16 sm:w-24 rounded shimmer"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Items Shimmer */}
                <Card className="elegant-shadow">
                  <CardHeader>
                    <div className="h-5 sm:h-6 w-28 sm:w-36 rounded-lg shimmer"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3 sm:gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shimmer-card shrink-0"></div>
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="h-4 sm:h-6 w-full sm:w-64 rounded-lg shimmer"></div>
                            <div className="flex gap-2">
                              <div className="h-3 sm:h-4 w-16 sm:w-20 rounded shimmer"></div>
                              <div className="h-3 sm:h-4 w-12 sm:w-16 rounded shimmer"></div>
                              <div className="h-3 sm:h-4 w-12 sm:w-16 rounded shimmer"></div>
                            </div>
                            <div className="sm:hidden space-y-1">
                              <div className="h-4 w-20 rounded shimmer"></div>
                              <div className="h-3 w-24 rounded shimmer"></div>
                            </div>
                          </div>
                          <div className="hidden sm:block text-right space-y-2 shrink-0">
                            <div className="h-5 sm:h-6 w-20 rounded-lg shimmer"></div>
                            <div className="h-4 w-16 rounded shimmer"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tracking Info Shimmer */}
                <Card className="elegant-shadow">
                  <CardHeader>
                    <div className="h-5 sm:h-6 w-36 sm:w-44 rounded-lg shimmer"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <div className="h-4 w-16 sm:w-20 rounded shimmer"></div>
                        <div className="h-4 w-24 sm:w-32 rounded shimmer"></div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <div className="h-4 w-20 sm:w-24 rounded shimmer"></div>
                        <div className="h-4 w-32 sm:w-40 rounded shimmer"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Shimmer */}
              <div className="space-y-6">
                <Card className="elegant-shadow">
                  <CardHeader>
                    <div className="h-5 sm:h-6 w-28 sm:w-36 rounded-lg shimmer"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 w-16 sm:w-20 rounded shimmer"></div>
                          <div className="h-4 w-12 sm:w-16 rounded shimmer"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="elegant-shadow">
                  <CardHeader>
                    <div className="h-5 sm:h-6 w-32 sm:w-44 rounded-lg shimmer"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 w-20 sm:w-24 rounded shimmer"></div>
                          <div className="h-4 w-16 sm:w-20 rounded shimmer"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div className="h-10 sm:h-12 w-full rounded-xl shimmer"></div>
                  <div className="h-10 sm:h-12 w-full rounded-xl shimmer"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                {error || "Order Not Found"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {error ? "Unable to load order details" : "The order you're looking for doesn't exist or you don't have permission to view it."}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchOrder} variant="outline">
                  Try Again
                </Button>
                <Button asChild>
                  <Link href="/orders">Back to Orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const statusSteps = getStatusSteps(order.status)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="elegant-hover">
                <Link href="/orders">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Orders
                </Link>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 elegant-gradient bg-clip-text text-transparent break-all">
                  Order #{order._id?.slice(-8).toUpperCase()}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Placed on {formatDateTimeIST(order.createdAt)} • IST
                </p>
                {order.trackingNumber && (
                  <p className="text-xs sm:text-sm font-semibold mt-2 break-all">
                    Tracking: <span className="font-mono bg-muted px-2 py-1 rounded text-xs sm:text-sm">{order.trackingNumber}</span>
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={`${getStatusColor(order.status)} capitalize text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 self-start shrink-0`}
              >
                {getStatusIcon(order.status)}
                <span className="ml-2">{order.status === "out_for_delivery" ? "Out for Delivery" : order.status}</span>
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tracking History Timeline */}
              {order.trackingHistory && order.trackingHistory.length > 0 && (
                <Card className="elegant-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Tracking History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...order.trackingHistory].reverse().map((tracking: any, index: number) => (
                        <div key={index} className="flex gap-3 sm:gap-4">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="rounded-full bg-background border-2 p-1">
                              {getTrackingStatusIcon(tracking.status)}
                            </div>
                            {index < order.trackingHistory!.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border mt-2 min-h-10" />
                            )}
                          </div>
                          <div className="flex-1 pb-4 min-w-0">
                            <p className="font-semibold text-sm sm:text-base">
                              {getTrackingStatusLabel(tracking.status)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 wrap-break-word">
                              {new Date(tracking.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </p>
                            {tracking.message && (
                              <p className="text-xs sm:text-sm mt-2 text-muted-foreground wrap-break-word">
                                {tracking.message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Timeline */}
              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusSteps.map((step, index) => (
                      <div key={step.status} className="flex items-center gap-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                            step.completed
                              ? "bg-primary border-primary text-white"
                              : step.active
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-muted border-muted-foreground/20 text-muted-foreground"
                          }`}
                        >
                          {step.icon}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${step.completed ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          {step.status === order.status && (
                            <p className="text-sm text-muted-foreground">Current status</p>
                          )}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`w-px h-8 ml-5 ${
                              step.completed ? "bg-primary" : "bg-muted-foreground/20"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Items Ordered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-3 sm:gap-4">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-lg line-clamp-2">{item.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <div className="w-3 h-3 rounded-full border shrink-0" style={{ backgroundColor: item.variant.color.toLowerCase() }}></div>
                              {item.variant.color}
                            </span>
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
                          <p className="font-semibold text-lg">₹{item.price.toFixed(2)}</p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-muted-foreground">
                              ₹{(item.price * item.quantity).toFixed(2)} total
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Information */}
              {order.tracking && (
                <Card className="elegant-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.tracking.carrier && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Carrier:</span>
                          <span className="font-medium">{order.tracking.carrier}</span>
                        </div>
                      )}
                      {order.tracking.trackingId && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <span className="text-muted-foreground text-sm">Tracking ID:</span>
                          <span className="font-mono text-xs sm:text-sm bg-muted px-2 py-1 rounded break-all">
                            {order.tracking.trackingId}
                          </span>
                        </div>
                      )}
                      {order.tracking.notes && (
                        <div>
                          <p className="text-muted-foreground mb-2">Notes:</p>
                          <p className="text-sm bg-muted/50 p-3 rounded-lg">
                            {order.tracking.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Address */}
              {order.shippingAddress && (
                <Card className="elegant-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p className="font-semibold">{order.shippingAddress.fullName}</p>
                      {order.shippingAddress.addressLine1 && (
                        <p className="text-muted-foreground">{order.shippingAddress.addressLine1}</p>
                      )}
                      {order.shippingAddress.addressLine2 && (
                        <p className="text-muted-foreground">{order.shippingAddress.addressLine2}</p>
                      )}
                      {order.shippingAddress.city && order.shippingAddress.state && (
                        <p className="text-muted-foreground">
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                      )}
                      <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                      <p className="text-muted-foreground mt-2">Phone: {order.shippingAddress.phone}</p>
                      <p className="text-muted-foreground">Email: {order.shippingAddress.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    
                    {order.coupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({order.coupon.code}):</span>
                        <span>-₹{calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping:</span>
                      <span>Free</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {order.payment && (
                <Card className="elegant-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${paymentStatusStyles(order.payment.status)}`}>
                          {paymentStatusLabel(order.payment.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-semibold">
                          ₹{(order.payment.amount ?? calculateTotal()).toFixed(2)} {order.payment.currency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="capitalize">{order.payment.method || "online"}</span>
                      </div>
                      {order.payment.razorpayOrderId && (
                        <div className="space-y-1 text-xs">
                          <p className="text-muted-foreground">Razorpay Order ID</p>
                          <p className="font-mono break-all bg-muted px-2 py-1 rounded">
                            {order.payment.razorpayOrderId}
                          </p>
                        </div>
                      )}
                      {order.payment.razorpayPaymentId && (
                        <div className="space-y-1 text-xs">
                          <p className="text-muted-foreground">Payment ID</p>
                          <p className="font-mono break-all bg-muted px-2 py-1 rounded">
                            {order.payment.razorpayPaymentId}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-mono text-xs">{order._id}</span>
                    </div>
                    {order.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tracking #:</span>
                        <span className="font-mono font-semibold">{order.trackingNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDateDDMMYYYY(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items:</span>
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                {order.trackingNumber && (
                  <Button 
                    asChild 
                    className="w-full elegant-gradient text-white"
                  >
                    <Link href={`/order-tracking?trackingNumber=${order.trackingNumber}`}>
                      <Truck className="h-4 w-4 mr-2" />
                      Track Order
                    </Link>
                  </Button>
                )}
                
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full elegant-hover"
                >
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
                
                {order.status === "delivered" && (
                  <Button variant="outline" className="w-full elegant-hover">
                    Write a Review
                  </Button>
                )}
                
                {(order.status === "placed" || order.status === "processing") && (
                  <Button variant="outline" className="w-full elegant-hover text-red-600 hover:text-red-700">
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}