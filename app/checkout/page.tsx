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

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null)
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
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]")
    if (savedCart.length === 0) {
      router.push("/cart")
      return;
    }
    
    // Ensure all cart items have the correct variant structure
    const updatedCart = savedCart.map((item: CartItem) => {
      if (!item.variant && (item.color || item.size)) {
        return {
          ...item,
          variant: {
            color: item.color || "",
            size: item.size || ""
          }
        };
      }
      return item;
    });
    
    setCart(updatedCart);
    
    // If the cart structure was updated, save it back
    if (JSON.stringify(updatedCart) !== JSON.stringify(savedCart)) {
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    }
    
    // Load saved coupon from localStorage
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      try {
        const coupon = JSON.parse(savedCoupon)
        setAppliedCoupon(coupon)
      } catch (e) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate that address is filled if checkbox is checked
    if (showAddressForm) {
      if (!formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
        alert("Please fill all required address fields")
        setLoading(false)
        return
      }
    }

    try {
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
        alert(data.error || "Failed to create order")
        setLoading(false)
        return
      }

      // Clear cart and coupon
      localStorage.removeItem("cart")
      localStorage.removeItem("appliedCoupon")

      // Redirect to success page with tracking number
      if (data.trackingNumber) {
        router.push(`/order-success?trackingNumber=${data.trackingNumber}`)
      } else {
        // Fallback to orderId if trackingNumber is not available
        router.push(`/order-success?trackingNumber=${data.orderId}`)
      }
    } catch (error) {
      alert("An error occurred. Please try again.")
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

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Show discount if coupon is applied */}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code} - {appliedCoupon.discountPercent}%)</span>
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
