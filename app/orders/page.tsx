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
import { Package, Truck, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Shimmer */}
            <div className="mb-8 space-y-3">
              <ShimmerHeading className="w-52" />
              <ShimmerText className="w-72" />
            </div>

            {/* Orders Shimmer */}
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <ShimmerOrderCard key={i} />
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
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Order #{order._id?.slice(-8).toUpperCase()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTimeIST(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(order.status)} capitalize`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="elegant-hover"
                        >
                          <Link href={`/orders/${order._id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                <Package className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="font-medium line-clamp-1">{item.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Color: {item.variant.color}</span>
                                <span>Size: {item.variant.size}</span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${item.price.toFixed(2)}</p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  ${(item.price * item.quantity).toFixed(2)} total
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Order Summary */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                          {order.coupon && (
                            <p className="text-sm text-green-600">
                              {order.coupon.discountPercent}% off with {order.coupon.code}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            ${calculateTotal(order).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                      </div>

                      {/* Tracking Info */}
                      {order.tracking && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h5 className="font-medium mb-2">Tracking Information</h5>
                          <div className="space-y-1 text-sm">
                            {order.tracking.carrier && (
                              <p>Carrier: {order.tracking.carrier}</p>
                            )}
                            {order.tracking.trackingId && (
                              <p>Tracking ID: {order.tracking.trackingId}</p>
                            )}
                            {order.tracking.notes && (
                              <p className="text-muted-foreground">{order.tracking.notes}</p>
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