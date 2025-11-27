"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, ShieldAlert, ShieldCheck, Calendar, Phone, Mail, User as UserIcon, Package, CheckCircle2, Clock, TruckIcon, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { User, Order } from "@/lib/types"

interface UserAnalytics {
  totalBusiness: number
  orderCount: number
  orderStatusCounts: {
    total: number
    placed: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  averageOrderValue: number
}

interface UserDetailsProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function UserDetails({ userId, isOpen, onClose }: UserDetailsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails()
    }
  }, [isOpen, userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/admin/users/${userId}/details`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch user details")
      }
      
      const data = await response.json()
      setUser(data.user)
      setOrders(data.orders)
      setAnalytics(data.analytics)
    } catch (err) {
      console.error("Error fetching user details:", err)
      setError("Failed to load user details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDisabled = async () => {
    if (!user) return
    
    try {
      setSavingStatus(true)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disabled: !user.disabled
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update user status")
      }
      
      const updatedUser = await response.json()
      setUser(updatedUser)
    } catch (err) {
      console.error("Error updating user status:", err)
      setError("Failed to update user status. Please try again.")
    } finally {
      setSavingStatus(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">User Details</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center p-8 text-destructive">
            <p>{error}</p>
            <Button variant="outline" onClick={fetchUserDetails} className="mt-4">
              Retry
            </Button>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Profile Section */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={user.image || ""} alt={`${user.name}'s profile picture`} />
                <AvatarFallback className="text-lg sm:text-xl">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{user.name}</h2>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                    {user.role}
                  </Badge>
                  {user.disabled && (
                    <Badge variant="destructive">Account Disabled</Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    <span className="text-muted-foreground">
                      ({formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span>
                      Provider: <span className="capitalize">{user.provider || "credentials"}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 w-full md:w-auto">
                <div className="flex items-center gap-4">
                  <Switch 
                    id="user-status" 
                    checked={!user.disabled} 
                    onCheckedChange={() => handleToggleDisabled()}
                    disabled={savingStatus}
                    aria-label="Toggle user account status"
                  />
                  <Label htmlFor="user-status" className="font-medium text-sm sm:text-base">
                    {user.disabled ? "Enable Account" : "Account Active"}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.disabled 
                    ? "User cannot log in while account is disabled" 
                    : "User can log in and access their account"
                  }
                </p>
              </div>
            </div>
            
            <Separator />
            
            {/* Analytics Summary */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="text-muted-foreground text-xs uppercase font-semibold tracking-wide">Total Business</div>
                    <div className="text-xl sm:text-2xl font-bold mt-1">₹{analytics.totalBusiness.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="text-muted-foreground text-xs uppercase font-semibold tracking-wide">Orders Placed</div>
                    <div className="text-xl sm:text-2xl font-bold mt-1">{analytics.orderCount}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="text-muted-foreground text-xs uppercase font-semibold tracking-wide">Average Order</div>
                    <div className="text-xl sm:text-2xl font-bold mt-1">₹{analytics.averageOrderValue.toFixed(0)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="text-muted-foreground text-xs uppercase font-semibold tracking-wide">Delivery Rate</div>
                    <div className="text-xl sm:text-2xl font-bold mt-1">
                      {analytics.orderCount ? 
                        `${Math.round((analytics.orderStatusCounts.delivered / analytics.orderCount) * 100)}%` : 
                        "N/A"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Orders Tab */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full overflow-x-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All ({analytics?.orderStatusCounts.total || 0})</TabsTrigger>
                <TabsTrigger value="placed" className="text-xs sm:text-sm">Placed ({analytics?.orderStatusCounts.placed || 0})</TabsTrigger>
                <TabsTrigger value="processing" className="text-xs sm:text-sm">Processing ({analytics?.orderStatusCounts.processing || 0})</TabsTrigger>
                <TabsTrigger value="shipped" className="text-xs sm:text-sm">Shipped ({analytics?.orderStatusCounts.shipped || 0})</TabsTrigger>
                <TabsTrigger value="delivered" className="text-xs sm:text-sm">Delivered ({analytics?.orderStatusCounts.delivered || 0})</TabsTrigger>
                <TabsTrigger value="cancelled" className="text-xs sm:text-sm">Cancelled ({analytics?.orderStatusCounts.cancelled || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <OrdersTable orders={orders} />
              </TabsContent>
              
              <TabsContent value="placed" className="mt-4">
                <OrdersTable orders={orders.filter(o => o.status === "placed")} />
              </TabsContent>
              
              <TabsContent value="processing" className="mt-4">
                <OrdersTable orders={orders.filter(o => o.status === "processing")} />
              </TabsContent>
              
              <TabsContent value="shipped" className="mt-4">
                <OrdersTable orders={orders.filter(o => o.status === "shipped")} />
              </TabsContent>
              
              <TabsContent value="delivered" className="mt-4">
                <OrdersTable orders={orders.filter(o => o.status === "delivered")} />
              </TabsContent>
              
              <TabsContent value="cancelled" className="mt-4">
                <OrdersTable orders={orders.filter(o => o.status === "cancelled")} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center p-8">
            <p>No user information found</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper component for the orders table
function OrdersTable({ orders }: { orders: Order[] }) {
  if (!orders.length) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No orders found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="User orders">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Order ID</th>
              <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm hidden sm:table-cell">Date</th>
              <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Items</th>
              <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Status</th>
              <th className="text-right p-2 sm:p-3 font-medium text-xs sm:text-sm">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              // Calculate order total
              const orderTotal = order.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
              }, 0);
              
              // Apply discount if coupon exists
              const finalTotal = order.coupon 
                ? orderTotal * (1 - order.coupon.discountPercent / 100)
                : orderTotal;
                
              return (
                <tr key={order._id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-2 sm:p-3">
                    <a 
                      href={`/admin/orders/${order._id}`} 
                      className="hover:underline text-primary font-mono text-xs block"
                      aria-label={`View order ${order._id?.toString().slice(-8).toUpperCase()}`}
                    >
                      #{order._id?.toString().slice(-8).toUpperCase()}
                    </a>
                    <span className="text-xs text-muted-foreground sm:hidden block mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3 whitespace-nowrap text-sm hidden sm:table-cell">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </td>
                  <td className="p-2 sm:p-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="p-2 sm:p-3 text-right font-medium text-sm">
                    ₹{finalTotal.toFixed(2)}
                    {order.coupon && (
                      <span className="block text-xs text-muted-foreground">
                        {order.coupon.discountPercent}% off
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper component for order status badge
function OrderStatusBadge({ status }: { status: Order["status"] }) {
  let icon;
  let variant: "default" | "secondary" | "destructive" | "outline";
  
  switch (status) {
    case "placed":
      icon = <Clock className="h-3 w-3 mr-1" />;
      variant = "secondary";
      break;
    case "processing":
      icon = <Clock className="h-3 w-3 mr-1" />;
      variant = "secondary";
      break;
    case "shipped":
      icon = <TruckIcon className="h-3 w-3 mr-1" />;
      variant = "outline";
      break;
    case "delivered":
      icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
      variant = "default";
      break;
    case "cancelled":
      icon = <XCircle className="h-3 w-3 mr-1" />;
      variant = "destructive";
      break;
    default:
      icon = <Clock className="h-3 w-3 mr-1" />;
      variant = "outline";
  }
  
  return (
    <Badge variant={variant} className="capitalize flex items-center w-fit">
      {icon}{status}
    </Badge>
  );
}