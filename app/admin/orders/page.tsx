"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UpdateOrderTracking } from "@/components/update-order-tracking"
import { AdminPagination } from "@/components/admin-pagination"
import type { Order } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import OrdersLoading from "./loading"

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<(Order & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalOrders, setTotalOrders] = useState(0)
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
        setOrders(Array.isArray(data) ? data : data.orders || [])
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
      setLoading(false)
      hasFetchedRef.current = false
      return
    }

    hasFetchedRef.current = false
    fetchOrders()
  }, [isAdmin, fetchOrders])

  useEffect(() => {
    if (!isAdmin) return

    const handleAdminStatsUpdate = () => {
      fetchOrders(true)
    }

    window.addEventListener('adminStatsUpdated', handleAdminStatsUpdate)
    return () => window.removeEventListener('adminStatsUpdated', handleAdminStatsUpdate)
  }, [isAdmin, fetchOrders])

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "placed":
        return "bg-blue-500"
      case "processing":
        return "bg-yellow-500"
      case "shipped":
        return "bg-purple-500"
      case "out_for_delivery":
        return "bg-orange-500"
      case "delivered":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading || status === "loading") {
    return <OrdersLoading />
  }

  if (session?.user?.role !== "admin") {
    return null
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Order Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage customer orders and update tracking information</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="w-full sm:w-auto touch-target"
            aria-label="Fix missing tracking information"
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/orders/fix-tracking', { method: 'POST' })
                const data = await response.json()
                if (response.ok) {
                  toast({
                    title: "Success",
                    description: data.message,
                    variant: "default"
                  })
                  fetchOrders() // Refresh orders list
                } else {
                  toast({
                    title: "Error", 
                    description: data.error || "Failed to fix tracking",
                    variant: "destructive"
                  })
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to fix tracking data",
                  variant: "destructive"
                })
              }
            }}
          >
            <span className="hidden sm:inline">Fix Missing Tracking</span>
            <span className="sm:hidden">Fix Tracking</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {orders.length === 0 ? (
          <CardContent className="p-8 sm:p-12 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">No orders found</p>
          </CardContent>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
              {orders.map((order) => (
            <Card key={order._id}>
              <CardHeader className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg">Order #{order._id.slice(-8)}</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${getStatusColor(order.status)} text-xs`}>{order.status}</Badge>
                    <UpdateOrderTracking
                      orderId={order._id}
                      currentStatus={order.status}
                      onStatusUpdated={fetchOrders}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
                          <span className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground"> ({item.variant.color}, {item.variant.size}) × {item.quantity}</span>
                          </span>
                          <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {order.tracking && (order.tracking.carrier || order.tracking.trackingId) && (
                    <div className="border-t pt-3 sm:pt-4">
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">Tracking Information</h4>
                      <div className="text-xs sm:text-sm space-y-1">
                        {order.tracking.carrier && <p><span className="font-medium">Carrier:</span> {order.tracking.carrier}</p>}
                        {order.tracking.trackingId && <p><span className="font-medium">Tracking ID:</span> {order.tracking.trackingId}</p>}
                        {order.tracking.notes && <p><span className="font-medium">Notes:</span> {order.tracking.notes}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
            </div>

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
          </>
        )}
      </div>
    </div>
  )
}
