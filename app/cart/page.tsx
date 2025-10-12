"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Minus } from "lucide-react"
import type { CartItem } from "@/lib/types"

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null)
  const [couponError, setCouponError] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]")
    setCart(savedCart)
    
    // Load saved coupon from localStorage
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      try {
        const coupon = JSON.parse(savedCoupon)
        setAppliedCoupon(coupon)
        setCouponCode(coupon.code)
      } catch (e) {
        localStorage.removeItem("appliedCoupon")
      }
    }
  }, [])

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
  }

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart]
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta)
    updateCart(newCart)
  }

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index)
    updateCart(newCart)
  }

  // Apply coupon function
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    setIsApplyingCoupon(true)
    setCouponError("")

    try {
      const response = await fetch(`/api/coupons?code=${encodeURIComponent(couponCode.trim())}`)
      
      if (!response.ok) {
        const data = await response.json()
        setCouponError(data.error || "Invalid coupon code")
        setAppliedCoupon(null)
        localStorage.removeItem("appliedCoupon")
        return
      }

      const coupon = await response.json()
      setAppliedCoupon(coupon)
      localStorage.setItem("appliedCoupon", JSON.stringify(coupon))
      setCouponError("")
    } catch (error) {
      console.error("Error applying coupon:", error)
      setCouponError("Failed to apply coupon")
      setAppliedCoupon(null)
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  // Remove coupon function
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
    localStorage.removeItem("appliedCoupon")
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  // Calculate discount if coupon is applied
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent / 100) : 0
  
  // Calculate shipping after discount
  const discountedSubtotal = subtotal - discountAmount
  const shipping = discountedSubtotal > 1500 ? 0 : 200
  const total = discountedSubtotal + shipping

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Your Cart is Empty</h1>
          <p className="text-muted-foreground">Add some items to get started</p>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-24 h-32 flex-shrink-0 rounded-md overflow-hidden">
                    <Image
                      src={item.image || "/placeholder.svg?height=128&width=96&query=dress"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Color: {item.color} | Size: {item.size}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => updateQuantity(index, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <Button variant="outline" size="icon" onClick={() => updateQuantity(index, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Order Summary</h2>

              <div className="space-y-2">
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
                {shipping > 0 && <p className="text-sm text-muted-foreground">Free shipping on orders over ₹1500</p>}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                {appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm flex justify-between items-center">
                      <span>Coupon <strong>{appliedCoupon.code}</strong> applied!</span>
                      <Button size="sm" variant="ghost" onClick={handleRemoveCoupon}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input 
                      placeholder="Coupon code" 
                      value={couponCode} 
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                    />
                    {couponError && <p className="text-sm text-red-500">{couponError}</p>}
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent" 
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon}
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply Coupon'}
                    </Button>
                  </div>
                )}
              </div>

              <Button className="w-full" size="lg" asChild>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>

              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
