"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingCart, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getCachedCart, updateCartCache } from "@/lib/cart-cache"
import { getCachedWishlist, updateWishlistCache } from "@/lib/wishlist-cache"

export function CartWishlistButtons() {
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateCounts = async () => {
      // 🚀 OPTIMIZATION Item 10 & 11: Try cache first for instant display
      let cachedCart = getCachedCart()
      let cachedWishlist = getCachedWishlist()
      
      try {
        console.log("Updating cart and wishlist counts...")
        
        if (cachedCart) {
          setCartCount(cachedCart.count)
          console.log("Cart count from cache:", cachedCart.count)
        }
        
        if (cachedWishlist) {
          setWishlistCount(cachedWishlist.count)
          console.log("Wishlist count from cache:", cachedWishlist.count)
        }
        
        // Fetch fresh data from API (in background)
        const res = await fetch('/api/cart-wishlist-counts', {
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        
        if (res.ok) {
          const data = await res.json()
          setCartCount(data.cartCount || 0)
          setWishlistCount(data.wishlistCount || 0)
          
          // Update cache with fresh data
          updateCartCache(data.cartItems || [])
          updateWishlistCache(data.wishlistProductIds || [])
          
          console.log("Updated counts from API - Cart:", data.cartCount, "Wishlist:", data.wishlistCount)
        } else {
          // User not authenticated or error
          if (!cachedCart) setCartCount(0)
          if (!cachedWishlist) setWishlistCount(0)
        }
      } catch (error) {
        console.error('Error fetching counts:', error)
        // Keep cache values if API fails
        if (!cachedCart) setCartCount(0)
        if (!cachedWishlist) setWishlistCount(0)
      }
    }
    
    updateCounts()
    
    // Setup event listeners for updates
    const handleUpdate = () => {
      updateCounts()
    }
    
    window.addEventListener("cartUpdated", handleUpdate)
    window.addEventListener("wishlistUpdated", handleUpdate)
    
    return () => {
      window.removeEventListener("cartUpdated", handleUpdate)
      window.removeEventListener("wishlistUpdated", handleUpdate)
    }
  }, [])

  // Keep the same layout during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <>
        <Link href="/search" className="inline-flex items-center justify-center rounded-xl h-10 w-10 hover:bg-accent elegant-hover" aria-label="Search">
          <Search className="h-5 w-5" />
        </Link>
        <Link href="/wishlist" className="inline-flex items-center justify-center rounded-xl h-10 w-10 relative hover:bg-accent elegant-hover" aria-label="Wishlist">
          <Heart className="h-5 w-5" />
        </Link>
        <Link href="/cart" className="inline-flex items-center justify-center rounded-xl h-10 w-10 relative hover:bg-accent elegant-hover" aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
        </Link>
      </>
    )
  }

  return (
    <>
      <Link href="/search" className="inline-flex items-center justify-center rounded-xl h-10 w-10 hover:bg-accent elegant-hover" aria-label="Search">
        <Search className="h-5 w-5" />
      </Link>

      <Link href="/wishlist" className="inline-flex items-center justify-center rounded-xl h-10 w-10 relative hover:bg-accent elegant-hover" aria-label="Wishlist">
        <Heart className="h-5 w-5" />
        {wishlistCount > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-white border-0 rounded-full">
            {wishlistCount}
          </Badge>
        )}
      </Link>

      <Link href="/cart" className="inline-flex items-center justify-center rounded-xl h-10 w-10 relative hover:bg-accent elegant-hover" aria-label="Cart">
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-white border-0 rounded-full">
            {cartCount}
          </Badge>
        )}
      </Link>
    </>
  )
}
