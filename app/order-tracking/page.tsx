"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Truck, CheckCircle, Clock, MapPin, XCircle } from "lucide-react"

const getTrackingStatusIcon = (status: string) => {
  switch (status) {
    case "placed":
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
    case "placed":
      return "Order Placed"
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

export default function OrderTrackingPage() {
  const searchParams = useSearchParams()
  const trackingNumberFromUrl = searchParams.get("trackingNumber")
  
  const [trackingNumber, setTrackingNumber] = useState(trackingNumberFromUrl || "")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Auto-track if tracking number is in URL
  useEffect(() => {
    if (trackingNumberFromUrl && !order) {
      handleTrack({ preventDefault: () => {} } as React.FormEvent)
    }
  }, [trackingNumberFromUrl])

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/orders/track?trackingNumber=${trackingNumber}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Order not found")
        setOrder(null)
      } else {
        setOrder(data)
      }
    } catch (err) {
      setError("Failed to track order. Please try again.")
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-500" />
      case "processing":
        return <Package className="h-6 w-6 text-blue-500" />
      case "shipped":
        return <Truck className="h-6 w-6 text-purple-500" />
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      default:
        return <Clock className="h-6 w-6 text-muted-foreground" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Track Your Order</h1>

        <Card>
          <CardHeader>
            <CardTitle>Enter Tracking Number</CardTitle>
            <CardDescription>Enter your order tracking number to see the current status</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  placeholder="Enter your tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Tracking..." : "Track Order"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {order && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Tracking Number: {order.trackingNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tracking History Timeline */}
              {order.trackingHistory && order.trackingHistory.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-4">Tracking History</h3>
                  <div className="space-y-4">
                    {[...order.trackingHistory].reverse().map((tracking: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="rounded-full bg-background border-2 p-1.5">
                            {getTrackingStatusIcon(tracking.status)}
                          </div>
                          {index < order.trackingHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="font-semibold text-sm">
                            {getTrackingStatusLabel(tracking.status)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(tracking.timestamp).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                          {tracking.message && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              {tracking.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 border-t pt-6">
                {getStatusIcon(order.status)}
                <div>
                  <p className="font-semibold capitalize">{order.status}</p>
                  <p className="text-sm text-muted-foreground">
                    Order placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {item.variant?.color} • {item.variant?.size} • Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  {order.coupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({order.coupon.code})</span>
                      <span>-₹{(order.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0) * (order.coupon.discountPercent / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{(() => {
                      const subtotal = order.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
                      const discount = order.coupon ? subtotal * (order.coupon.discountPercent / 100) : 0;
                      return (subtotal - discount).toFixed(2);
                    })()}</span>
                  </div>
                </div>
              </div>

              {order.shippingAddress && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.fullName}
                    <br />
                    {order.shippingAddress.addressLine1 && (
                      <>
                        {order.shippingAddress.addressLine1}
                        <br />
                      </>
                    )}
                    {order.shippingAddress.addressLine2 && (
                      <>
                        {order.shippingAddress.addressLine2}
                        <br />
                      </>
                    )}
                    {order.shippingAddress.city && order.shippingAddress.state && (
                      <>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        <br />
                      </>
                    )}
                    {order.shippingAddress.country}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
