"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { PackageCheck, Loader2 } from "lucide-react"

interface UpdateOrderTrackingProps {
  orderId: string
  currentStatus: string
  onStatusUpdated?: () => void
}

const trackingStatuses = [
  { value: "order_confirmed", label: "Order Confirmed", description: "Order has been confirmed" },
  { value: "processing", label: "Processing", description: "Order is being prepared" },
  { value: "shipped", label: "Shipped", description: "Order has been shipped" },
  { value: "out_for_delivery", label: "Out for Delivery", description: "Order is out for delivery" },
  { value: "delivered", label: "Delivered", description: "Order has been delivered" },
  { value: "cancelled", label: "Cancelled", description: "Order has been cancelled" },
]

export function UpdateOrderTracking({ orderId, currentStatus, onStatusUpdated }: UpdateOrderTrackingProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpdateStatus = async () => {
    if (!status) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, message }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update order status")
      }

      toast({
        title: "Success",
        description: "Order tracking status updated successfully",
        className: "bg-green-50 border-green-200 text-green-900"
      })

      setOpen(false)
      setStatus("")
      setMessage("")
      
      // Call the callback to refresh order data
      if (onStatusUpdated) {
        onStatusUpdated()
      }
    } catch (error: any) {
      console.error("Update status error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PackageCheck className="mr-2 h-4 w-4" />
          Update Tracking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Order Tracking Status</DialogTitle>
          <DialogDescription>
            Update the tracking status for this order. Customers will see this in their order tracking page.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Tracking Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {trackingStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a custom message for this status update..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default message
            </p>
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Current Status:</p>
            <p className="text-muted-foreground">{currentStatus}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
