"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// Types for tracking information
type TrackingInfo = {
  carrier?: string
  trackingId?: string
  notes?: string
}
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Truck, Clock } from "lucide-react"
import { TrackingManagement } from "@/components/tracking-management"
import type { Order } from "@/lib/types"

export default function AdminTrackingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<(Order & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderTracking = async (orderId: string, trackingInfo: { carrier?: string, trackingId?: string, notes?: string }) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "shipped", // Automatically set to shipped when tracking is added
          tracking: trackingInfo,
        }),
      })

      if (response.ok) {
        await fetchOrders()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to update tracking:", error)
      return false
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading...</p>
      </div>
    )
  }

  if (session?.user?.role !== "admin") {
    return null
  }

  // Format orders for the tracking component
  const formattedOrders = orders.map(order => ({
    _id: order._id,
    orderNumber: order._id.slice(-8), // Last 8 chars of order ID
    status: order.status,
    createdAt: order.createdAt,
    items: order.items,
    tracking: order.tracking ? {
      carrier: order.tracking.carrier,
      trackingId: order.tracking.trackingId,
      notes: order.tracking.notes
    } : undefined
  }))

  // Separate orders by status
  const pendingOrders = formattedOrders.filter(order => 
    order.status === "placed" || order.status === "processing"
  )
  
  const shippedOrders = formattedOrders.filter(order => 
    order.status === "shipped"
  )
  
  const completedOrders = formattedOrders.filter(order => 
    order.status === "delivered" || order.status === "cancelled"
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 elegant-gradient bg-clip-text text-transparent">
          Order Tracking Management
        </h1>
        <p className="text-muted-foreground">
          Add and update tracking information for customer orders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-4 border-0 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Package className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Pending Orders</p>
              <p className="text-2xl font-semibold">{pendingOrders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-0 bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Truck className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-purple-700">Shipped Orders</p>
              <p className="text-2xl font-semibold">{shippedOrders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-0 bg-green-50">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Clock className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-green-700">Completed Orders</p>
              <p className="text-2xl font-semibold">{completedOrders.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card className="border-0 elegant-shadow bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <TrackingManagement 
                orders={formattedOrders} 
                onUpdateTracking={updateOrderTracking} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending">
          <Card className="border-0 elegant-shadow bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <TrackingManagement 
                orders={pendingOrders} 
                onUpdateTracking={updateOrderTracking} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shipped">
          <Card className="border-0 elegant-shadow bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <TrackingManagement 
                orders={shippedOrders} 
                onUpdateTracking={updateOrderTracking} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card className="border-0 elegant-shadow bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <TrackingManagement 
                orders={completedOrders} 
                onUpdateTracking={updateOrderTracking} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}