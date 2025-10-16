"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { indianStates } from "@/lib/indian-states"
import type { CartItem } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number; minOrderValue?: number } | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [couponError, setCouponError] = useState("")
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  })

  useEffect(() => {
    // Fetch cart from API instead of localStorage
    const fetchCart = async () => {
      try {
        const response = await fetch('/api/cart', {
          cache: 'no-store',
        })
        
        if (!response.ok) {
          router.push("/cart")
          return
        }
        
        const data = await response.json()
        const cartItems = data.items || []
        
        if (cartItems.length === 0) {
          router.push("/cart")
          return
        }
        
        // Ensure all cart items have the correct variant structure
        const updatedCart = cartItems.map((item: CartItem) => {
          if (!item.variant && (item.color || item.size)) {
            return {
              ...item,
              variant: {
                color: item.color || "",
                size: item.size || ""
              }
            }
          }
          return item
        })
        
        setCart(updatedCart)
      } catch (error) {
        console.error('Error fetching cart:', error)
        router.push("/cart")
      }
    }
    
    fetchCart()
    
    // Load and validate saved coupon from localStorage
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      try {
        const coupon = JSON.parse(savedCoupon)
        // Set the applied coupon from localStorage
        setAppliedCoupon(coupon)
        setCouponCode(coupon.code) // Also set the coupon code
        console.log("Loaded coupon from localStorage:", coupon)
      } catch (e) {
        console.error("Error loading coupon from localStorage:", e)
        localStorage.removeItem("appliedCoupon")
      }
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleStateChange = (value: string) => {
    setFormData({ ...formData, state: value })
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    // Prevent applying multiple coupons
    if (appliedCoupon) {
      setCouponError("Please remove the current coupon before applying a new one")
      return
    }
    
    setApplyingCoupon(true)
    setCouponError("")
    
    try {
      const response = await fetch(`/api/coupons?code=${encodeURIComponent(couponCode.trim())}`, {
        method: "GET"
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setCouponError(data.error || "Failed to apply coupon")
        setAppliedCoupon(null)
        localStorage.removeItem("appliedCoupon")
        return
      }
      
      // Check minimum order value requirement
      if (data.minOrderValue && subtotal < data.minOrderValue) {
        setCouponError(`This coupon requires a minimum order of ₹${data.minOrderValue}`)
        setAppliedCoupon(null)
        localStorage.removeItem("appliedCoupon")
        return
      }
      
      // Apply the coupon
      setAppliedCoupon(data)
      localStorage.setItem("appliedCoupon", JSON.stringify(data))
      setCouponCode("") // Clear the input after successful application
      setCouponError("")
    } catch (error) {
      setCouponError("An error occurred. Please try again.")
    } finally {
      setApplyingCoupon(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate that address is filled if checkbox is checked
    if (showAddressForm) {
      if (!formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
        toast({
          title: "Validation Error",
          description: "Please fill all required address fields",
          variant: "destructive"
        })
        setLoading(false)
        return
      }
    }
    
    // Check coupon minimum order value if applied
    if (appliedCoupon && appliedCoupon.minOrderValue && appliedCoupon.minOrderValue > subtotal) {
      toast({
        title: "Coupon Error", 
        description: `The applied coupon requires a minimum order of ₹${appliedCoupon.minOrderValue}`,
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    try {
      // 🚀 OPTIMIZATION: Order API now handles validation, no need for pre-validation
      // Removed duplicate stock validation call - order API does it all
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          coupon: appliedCoupon,
          shippingAddress: showAddressForm ? formData : {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            country: "India"
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === "Insufficient stock" && data.details) {
          toast({
            title: "Stock Issues",
            description: `${data.details.join(", ")}. Please refresh the page and update your cart.`,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Order Failed",
            description: data.error || "Failed to create order",
            variant: "destructive"
          })
        }
        setLoading(false)
        return
      }

      // 🚀 Cart is already cleared on the server, now clear all local caches
      localStorage.removeItem("cart")
      localStorage.removeItem("appliedCoupon")
      
      // Clear cart cache
      try {
        const { updateCartCache } = await import("@/lib/cart-cache")
        updateCartCache([]) // Clear cart cache
      } catch (e) {
        console.debug("Cart cache clear skipped:", e)
      }

      // Clear product cache to reflect updated stock levels
      try {
        const { clearProductCache } = await import("@/lib/product-cache")
        await clearProductCache()
        console.log("Product cache cleared after order placement")
      } catch (e) {
        console.debug("Product cache clear skipped:", e)
      }

      // Clear sessionStorage product cache as well
      try {
        const { clearProductListCache } = await import("@/lib/product-list-cache")
        clearProductListCache()
        console.log("SessionStorage product cache cleared after order placement")
      } catch (e) {
        console.debug("SessionStorage product cache clear skipped:", e)
      }

      // Clear admin cache to reflect new order count
      try {
        const { deleteAdminCache, ADMIN_CACHE_KEYS } = await import("@/lib/admin-cache")
        deleteAdminCache(ADMIN_CACHE_KEYS.DASHBOARD_STATS)
        console.log("Admin dashboard cache cleared after order placement")
      } catch (e) {
        console.debug("Admin cache clear skipped:", e)
      }
      
      // Dispatch events to update UI (header cart count, product stock, etc.)
      window.dispatchEvent(new Event("cartUpdated"))
      window.dispatchEvent(new Event("productStockUpdated"))
      window.dispatchEvent(new Event("adminStatsUpdated"))

      // Redirect to success page with tracking number
      if (data.trackingNumber) {
        router.push(`/order-success?trackingNumber=${data.trackingNumber}`)
      } else {
        // Fallback to orderId if trackingNumber is not available
        router.push(`/order-success?trackingNumber=${data.orderId}`)
      }
    } catch (error) {
      console.error("Order submission error:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent / 100) : 0
  const discountedSubtotal = subtotal - discountAmount
  const shipping = discountedSubtotal > 1500 ? 0 : 200
  const total = discountedSubtotal + shipping

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Form Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="fillAddress" 
                    checked={showAddressForm}
                    onCheckedChange={(checked) => setShowAddressForm(checked as boolean)}
                  />
                  <Label htmlFor="fillAddress" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Fill shipping address
                  </Label>
                </div>

                {/* Personal Information - Always visible */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input 
                      id="fullName" 
                      name="fullName" 
                      placeholder="Enter your full name"
                      value={formData.fullName} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="Enter your phone number"
                    value={formData.phone} 
                    onChange={handleChange} 
                    required 
                  />
                </div>

                {/* Address fields - Only visible when checkbox is checked */}
                {showAddressForm && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input
                        id="addressLine1"
                        name="addressLine1"
                        placeholder="House number, building name, street"
                        value={formData.addressLine1}
                        onChange={handleChange}
                        required={showAddressForm}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input 
                        id="addressLine2" 
                        name="addressLine2" 
                        placeholder="Landmark, area, locality (optional)"
                        value={formData.addressLine2} 
                        onChange={handleChange} 
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input 
                          id="city" 
                          name="city" 
                          placeholder="Enter your city"
                          value={formData.city} 
                          onChange={handleChange} 
                          required={showAddressForm} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Select onValueChange={handleStateChange} value={formData.state} required={showAddressForm}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your state" />
                          </SelectTrigger>
                          <SelectContent>
                            {indianStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          placeholder="Enter PIN code"
                          value={formData.postalCode}
                          onChange={handleChange}
                          required={showAddressForm}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input 
                        id="country" 
                        name="country" 
                        value="India" 
                        readOnly 
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <div>{item.name} x {item.quantity}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.variant ? 
                            `${item.variant.color} / ${item.variant.size}` : 
                            (item.color && item.size ? `${item.color} / ${item.size}` : "")}
                        </div>
                      </div>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <div className="border-t pt-4 pb-2">
                  {!appliedCoupon ? (
                    <>
                      <div className="flex gap-2 mb-3">
                        <Input 
                          id="couponCode"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1"
                          disabled={applyingCoupon}
                        />
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || applyingCoupon}
                        >
                          {applyingCoupon ? "Applying..." : "Apply"}
                        </Button>
                      </div>
                      
                      {couponError && (
                        <div className="text-sm text-red-600 mb-2">{couponError}</div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700 dark:text-green-300">
                          Coupon <strong>{appliedCoupon.code}</strong> applied!
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null)
                            localStorage.removeItem("appliedCoupon")
                            setCouponError("")
                          }}
                          className="text-red-500 hover:text-red-700 font-medium"
                          aria-label="Remove coupon"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Show discount if coupon is applied */}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <div className="flex items-center gap-2">
                        <span>Discount ({appliedCoupon.code} - {appliedCoupon.discountPercent}%)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null)
                            localStorage.removeItem("appliedCoupon")
                          }}
                          className="text-xs text-red-500 hover:text-red-700"
                          aria-label="Remove coupon"
                        >
                          ✕
                        </button>
                      </div>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Processing..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
