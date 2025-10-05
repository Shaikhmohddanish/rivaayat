"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/lib/types"

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<(Order & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrder, setEditingOrder] = useState<(Order & { _id: string }) | null>(null)
  const [editForm, setEditForm] = useState({
    status: "" as Order["status"],
    carrier: "",
    trackingId: "",
    notes: "",
  })

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

  const handleEdit = (order: Order & { _id: string }) => {
    setEditingOrder(order)
    setEditForm({
      status: order.status,
      carrier: order.tracking?.carrier || "",
      trackingId: order.tracking?.trackingId || "",
      notes: order.tracking?.notes || "",
    })
  }

  const handleUpdate = async () => {
    if (!editingOrder) return

    try {
      const response = await fetch(`/api/admin/orders/${editingOrder._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editForm.status,
          tracking: {
            carrier: editForm.carrier,
            trackingId: editForm.trackingId,
            notes: editForm.notes,
          },
        }),
      })

      if (response.ok) {
        await fetchOrders()
        setEditingOrder(null)
      } else {
        alert("Failed to update order")
      }
    } catch (error) {
      console.error("Failed to update order:", error)
      alert("Failed to update order")
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "placed":
        return "bg-blue-500"
      case "processing":
        return "bg-yellow-500"
      case "shipped":
        return "bg-purple-500"
      case "delivered":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">Manage customer orders and update tracking information</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order._id.slice(-8)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => handleEdit(order)}>
                          Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Order</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={editForm.status}
                              onValueChange={(value: Order["status"]) => setEditForm({ ...editForm, status: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="placed">Placed</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Carrier</Label>
                            <Input
                              value={editForm.carrier}
                              onChange={(e) => setEditForm({ ...editForm, carrier: e.target.value })}
                              placeholder="e.g., FedEx, UPS, USPS"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tracking ID</Label>
                            <Input
                              value={editForm.trackingId}
                              onChange={(e) => setEditForm({ ...editForm, trackingId: e.target.value })}
                              placeholder="Enter tracking number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              placeholder="Additional notes"
                            />
                          </div>
                          <Button onClick={handleUpdate} className="w-full">
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.name} ({item.variant.color}, {item.variant.size}) x {item.quantity}
                          </span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {order.tracking && (order.tracking.carrier || order.tracking.trackingId) && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Tracking Information</h4>
                      <div className="text-sm space-y-1">
                        {order.tracking.carrier && <p>Carrier: {order.tracking.carrier}</p>}
                        {order.tracking.trackingId && <p>Tracking ID: {order.tracking.trackingId}</p>}
                        {order.tracking.notes && <p>Notes: {order.tracking.notes}</p>}
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
  )
}
