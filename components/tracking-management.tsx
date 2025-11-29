"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { Truck, Search, RefreshCw, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Order } from "@/lib/types"

interface TrackingInfo {
  carrier?: string
  trackingId?: string
  notes?: string
}

// Type guard to ensure all properties are defined
function isCompleteTrackingInfo(info: Partial<TrackingInfo>): info is Required<Pick<TrackingInfo, 'carrier' | 'trackingId'>> {
  return Boolean(info.carrier && info.trackingId);
}

interface OrderTracking {
  _id: string
  orderNumber: string
  status: Order["status"]
  createdAt: Date
  items: Order["items"]
  tracking?: {
    carrier?: string
    trackingId?: string
    notes?: string
  }
}

interface TrackingManagementProps {
  orders: OrderTracking[]
  onUpdateTracking: (orderId: string, trackingInfo: { carrier?: string, trackingId?: string, notes?: string }) => Promise<boolean>
}

export function TrackingManagement({ orders, onUpdateTracking }: TrackingManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { toast } = useToast()

  // Filter orders based on search query and status filter
  const filteredOrders = useMemo(() => {
    if (!searchQuery && filterStatus === "all") {
      return orders // No filtering needed
    }
    
    return orders.filter(order => {
      const matchesSearch = !searchQuery || 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.tracking?.trackingId || "").toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "untracked" && !order.tracking?.trackingId) ||
                           (filterStatus === "tracked" && order.tracking?.trackingId) ||
                           order.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, filterStatus])

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus])

  // Calculate pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentOrders = filteredOrders.slice(startIndex, endIndex)
    
    return { totalPages, startIndex, endIndex, currentOrders }
  }, [filteredOrders, currentPage, itemsPerPage])
  
  const { totalPages, startIndex, endIndex, currentOrders } = paginationData

  const handleTrackingUpdate = useCallback(async (orderId: string, trackingInfo: TrackingInfo) => {
    setLoadingOrderId(orderId)
    try {
      const success = await onUpdateTracking(orderId, trackingInfo)
      if (success) {
        toast({
          title: "Tracking Updated",
          description: "The tracking information has been successfully updated.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update tracking information.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoadingOrderId(null)
    }
  }, [onUpdateTracking, toast])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order number or tracking ID..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="untracked">Untracked Orders</SelectItem>
              <SelectItem value="tracked">Tracked Orders</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="border-0 bg-muted/50">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Truck className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Orders Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all" 
                ? "Try changing your search or filter criteria" 
                : "No orders available for tracking management"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <TrackingCard
                key={order._id}
                order={order}
                isLoading={loadingOrderId === order._id}
                onUpdateTracking={(trackingInfo) => handleTrackingUpdate(order._id, trackingInfo)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-9"
                        >
                          {page}
                        </Button>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-1">...</span>
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface TrackingCardProps {
  order: OrderTracking
  isLoading: boolean
  onUpdateTracking: (trackingInfo: { carrier?: string, trackingId?: string, notes?: string }) => void
}

const TrackingCard = React.memo(function TrackingCard({ order, isLoading, onUpdateTracking }: TrackingCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo>({
    carrier: order.tracking?.carrier ?? "",
    trackingId: order.tracking?.trackingId ?? "",
    notes: order.tracking?.notes ?? ""
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Ensure required fields are filled
    if (!trackingInfo.carrier || !trackingInfo.trackingId) {
      return;
    }
    onUpdateTracking(trackingInfo)
    setIsEditing(false)
  }
  
  return (
    <Card className="overflow-hidden border-0 bg-card/80 backdrop-blur-sm transition-all duration-300">
      <CardHeader className="bg-muted/50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md">
              Order #{order.orderNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            {!isEditing ? (
              <Button 
                size="sm" 
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                {order.tracking?.trackingId ? "Edit Tracking" : "Add Tracking"}
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={() => setIsEditing(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!isEditing ? (
          <div className="space-y-2">
            {order.tracking?.trackingId ? (
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Tracked</Badge>
                </div>
                <p className="font-semibold mt-2">{order.tracking.carrier || "Unknown Carrier"}</p>
                <p className="font-mono">{order.tracking.trackingId}</p>
                {order.tracking.notes && (
                  <div className="mt-2 text-muted-foreground border-t pt-2">
                    <p>{order.tracking.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Not Tracked
                  </Badge>
                </div>
                <p className="mt-2">No tracking information has been added yet.</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`carrier-${order._id}`}>Shipping Carrier</Label>
              <Input
                id={`carrier-${order._id}`}
                placeholder="FedEx, UPS, USPS, etc."
                value={trackingInfo.carrier}
                onChange={(e) => setTrackingInfo({ ...trackingInfo, carrier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`tracking-id-${order._id}`}>Tracking Number</Label>
              <Input
                id={`tracking-id-${order._id}`}
                placeholder="Enter tracking number"
                value={trackingInfo.trackingId}
                onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`notes-${order._id}`}>Notes (Optional)</Label>
              <Textarea
                id={`notes-${order._id}`}
                placeholder="Additional shipping or delivery information..."
                value={trackingInfo.notes}
                onChange={(e) => setTrackingInfo({ ...trackingInfo, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Tracking Information
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
})