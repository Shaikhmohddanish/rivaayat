"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Minus } from "lucide-react"
import type { CartItem } from "@/lib/types"
import { getCachedCart, updateCartCache } from "@/lib/cart-cache"
import { useToast } from "@/hooks/use-toast"

export default function CartPage() {
  const { toast } = useToast()
  const [cart, setCart] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number; minOrderValue?: number } | null>(null)
  const [couponError, setCouponError] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set())
  const [removingItems, setRemovingItems] = useState<Set<number>>(new Set())
  const [productStocks, setProductStocks] = useState<Record<string, number>>({})

  useEffect(() => {
    // 🚀 OPTIMIZATION Item 10: Try cache first for instant display
    const fetchCart = async () => {
      // Load from cache immediately
      const cached = getCachedCart()
      if (cached) {
        setCart(cached.items)
        console.log("Cart loaded from cache:", cached.items.length, "items")
      }
      
      try {
        // Fetch fresh data in background
        const response = await fetch('/api/cart', {
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        
        if (response.ok) {
          const data = await response.json()
          const freshItems = data.items || []
          setCart(freshItems)
          
          // Update cache
          updateCartCache(freshItems)
          console.log("Cart updated from API:", freshItems.length, "items")
          
          // Fetch stock information for all cart items
          await fetchStockInfo(freshItems)
        } else {
          console.error('Failed to fetch cart')
          if (!cached) setCart([])
        }
      } catch (error) {
        console.error('Error fetching cart:', error)
        if (!cached) setCart([])
      }
    }
    
    fetchCart()
    
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

  // Fetch stock information for cart items
  const fetchStockInfo = async (items: CartItem[]) => {
    const stockInfo: Record<string, number> = {}
    
    for (const item of items) {
      try {
        const response = await fetch(`/api/products/${item.productId}`)
        if (response.ok) {
          const product = await response.json()
          const variant = product.variations?.variants?.find(
            (v: any) => v.color === item.variant?.color && v.size === item.variant?.size
          )
          if (variant) {
            const key = `${item.productId}-${item.variant?.color}-${item.variant?.size}`
            stockInfo[key] = variant.stock || 0
          }
        }
      } catch (error) {
        console.error('Error fetching stock info:', error)
      }
    }
    
    setProductStocks(stockInfo)
  }

  const getStockForItem = (item: CartItem): number => {
    const key = `${item.productId}-${item.variant?.color}-${item.variant?.size}`
    return productStocks[key] || 0
  }

  const updateCart = async (newCart: CartItem[]) => {
    setCart(newCart)
    
    // 🚀 OPTIMIZATION Item 10: Update cache when cart changes
    updateCartCache(newCart)
    
    // Trigger event to update cart count in header
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const updateQuantity = async (index: number, delta: number) => {
    // Prevent multiple simultaneous updates to the same item
    if (updatingItems.has(index)) return
    
    const item = cart[index]
    const availableStock = getStockForItem(item)
    const newQuantity = Math.max(1, item.quantity + delta)
    
    // Check if trying to exceed available stock
    if (delta > 0 && availableStock > 0 && newQuantity > availableStock) {
      toast({
        title: "Stock limit reached",
        description: `Only ${availableStock} ${availableStock === 1 ? 'item' : 'items'} available in stock`,
        variant: "destructive"
      })
      return
    }
    
    // Mark item as updating
    setUpdatingItems(prev => new Set(prev).add(index))
    
    // Optimistic update - update UI immediately
    const previousCart = [...cart]
    const newCart = [...cart]
    newCart[index].quantity = newQuantity
    setCart(newCart)
    updateCartCache(newCart)
    
    // Update quantity via API
    try {
      const response = await fetch('/api/cart/update-quantity', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: item.productId,
          variant: item.variant,
          quantity: newQuantity,
        }),
      })
      
      if (response.ok) {
        // Trigger event to update cart count
        window.dispatchEvent(new Event("cartUpdated"))
      } else {
        // Revert on failure
        const errorData = await response.json()
        console.error('Failed to update cart item:', errorData)
        
        // Show specific error message
        if (errorData.availableStock !== undefined) {
          toast({
            title: "Insufficient stock",
            description: `Only ${errorData.availableStock} ${errorData.availableStock === 1 ? 'item' : 'items'} available`,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Error",
            description: errorData.error || "Failed to update quantity",
            variant: "destructive"
          })
        }
        
        setCart(previousCart)
        updateCartCache(previousCart)
      }
    } catch (error) {
      // Revert on error
      console.error('Error updating cart item:', error)
      setCart(previousCart)
      updateCartCache(previousCart)
    } finally {
      // Remove from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  const removeItem = async (index: number) => {
    // Prevent multiple simultaneous removals
    if (removingItems.has(index)) return
    
    const item = cart[index]
    
    // Mark item as removing
    setRemovingItems(prev => new Set(prev).add(index))
    
    try {
      const response = await fetch('/api/cart/items', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: item.productId,
          variant: item.variant,
        }),
      })
      
      if (response.ok) {
        // Update local state
        const newCart = cart.filter((_, i) => i !== index)
        updateCart(newCart)
      } else {
        console.error('Failed to remove cart item')
      }
    } catch (error) {
      console.error('Error removing cart item:', error)
    } finally {
      // Remove from removing set
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  // Apply coupon function
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    // Prevent applying multiple coupons
    if (appliedCoupon) {
      setCouponError("Please remove the current coupon before applying a new one")
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
      
      // Check minimum order value
      if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
        setCouponError(`This coupon requires a minimum order of ₹${coupon.minOrderValue}`)
        setAppliedCoupon(null)
        localStorage.removeItem("appliedCoupon")
        return
      }
      
      setAppliedCoupon(coupon)
      localStorage.setItem("appliedCoupon", JSON.stringify(coupon))
      console.log("Coupon saved to localStorage:", coupon)
      setCouponCode(coupon.code) // Set to the actual coupon code from response
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
                          Color: {item.variant?.color || item.color} | Size: {item.variant?.size || item.size}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(index)}
                        disabled={removingItems.has(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => updateQuantity(index, -1)}
                            disabled={updatingItems.has(index) || item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => updateQuantity(index, 1)}
                            disabled={updatingItems.has(index) || (getStockForItem(item) > 0 && item.quantity >= getStockForItem(item))}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {getStockForItem(item) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {getStockForItem(item)} available
                          </p>
                        )}
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
