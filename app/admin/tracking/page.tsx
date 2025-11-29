"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { AdminPagination } from "@/components/admin-pagination"
import type { Order } from "@/lib/types"

export default function AdminTrackingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<(Order & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [totalOrders, setTotalOrders] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const isAdmin = session?.user?.role === "admin"
  const hasFetchedRef = useRef(false)
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/")
    }
  }, [status, session, router])

  const fetchOrders = useCallback(async (force = false) => {
    if (!isAdmin) return
    if (inFlightRef.current && !force) return

    inFlightRef.current = true
    setLoading(true)
    try {
      const skip = (currentPage - 1) * itemsPerPage
      const response = await fetch(`/api/admin/orders?limit=${itemsPerPage}&skip=${skip}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setTotalOrders(data.total || 0)
        hasFetchedRef.current = true
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }, [isAdmin, currentPage, itemsPerPage])

  useEffect(() => {
    if (!isAdmin) {
      setOrders([])
      setTotalOrders(0)
      setLoading(false)
      hasFetchedRef.current = false
      return
    }

    hasFetchedRef.current = false
    fetchOrders()
  }, [isAdmin, fetchOrders])

  const updateOrderTracking = useCallback(async (orderId: string, trackingInfo: { carrier?: string, trackingId?: string, notes?: string }) => {
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
        await fetchOrders(true)
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to update tracking:", error)
      return false
    }
  }, [fetchOrders])

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="h-10 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-5 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
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
        <Card className="p-4 border-0 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
              <Package className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Pending Orders</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{pendingOrders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-0 bg-purple-50 dark:bg-purple-950">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
              <Truck className="h-6 w-6 text-purple-700 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Shipped Orders</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{shippedOrders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-0 bg-green-50 dark:bg-green-950">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
              <Clock className="h-6 w-6 text-green-700 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Completed Orders</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{completedOrders.length}</p>
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
            <AdminPagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalOrders / itemsPerPage)}
              totalItems={totalOrders}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items)
                setCurrentPage(1)
              }}
            />
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
            <AdminPagination
              currentPage={currentPage}
              totalPages={Math.ceil(pendingOrders.length / itemsPerPage)}
              totalItems={pendingOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items)
                setCurrentPage(1)
              }}
            />
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
            <AdminPagination
              currentPage={currentPage}
              totalPages={Math.ceil(shippedOrders.length / itemsPerPage)}
              totalItems={shippedOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items)
                setCurrentPage(1)
              }}
            />
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
            <AdminPagination
              currentPage={currentPage}
              totalPages={Math.ceil(completedOrders.length / itemsPerPage)}
              totalItems={completedOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items)
                setCurrentPage(1)
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}