"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Truck, CheckCircle, Clock } from "lucide-react"

export default function OrderTrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
              <div className="flex items-center gap-4">
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
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.fullName}
                  <br />
                  {order.shippingAddress.addressLine1}
                  <br />
                  {order.shippingAddress.addressLine2 && (
                    <>
                      {order.shippingAddress.addressLine2}
                      <br />
                    </>
                  )}
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  <br />
                  {order.shippingAddress.country}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
