"use client"

import { Badge } from "@/components/ui/badge"
import { Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react"
import type { Order } from "@/lib/types"

interface OrderStatusBadgeProps {
  status: Order["status"]
  className?: string
}

export function OrderStatusBadge({ status, className = "" }: OrderStatusBadgeProps) {
  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "placed":
        return <Clock className="h-3 w-3" />
      case "processing":
        return <Package className="h-3 w-3" />
      case "shipped":
        return <Truck className="h-3 w-3" />
      case "delivered":
        return <CheckCircle className="h-3 w-3" />
      case "cancelled":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
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

  return (
    <Badge
      variant="outline"
      className={`${getStatusColor(status)} capitalize ${className}`}
    >
      {getStatusIcon(status)}
      <span className="ml-1">{status}</span>
    </Badge>
  )
}

interface OrderSummaryProps {
  order: Order
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const calculateTotal = () => {
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </span>
        <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
      </div>
      {order.coupon && (
        <div className="text-xs text-green-600">
          {order.coupon.discountPercent}% off with {order.coupon.code}
        </div>
      )}
      <OrderStatusBadge status={order.status} className="text-xs" />
    </div>
  )
}