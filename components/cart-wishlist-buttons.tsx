"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingCart, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function CartWishlistButtons() {
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateCounts = async () => {
      try {
        // Fetch cart data from API
        const cartRes = await fetch('/api/cart', {
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        const cartData = cartRes.ok ? await cartRes.json() : { items: [] }
        const cartItems = cartData.items || []
        setCartCount(cartItems.reduce((sum: number, item: any) => sum + (item?.quantity || 0), 0))
        
        // Fetch wishlist data from API
        const wishlistRes = await fetch('/api/wishlist', {
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        const wishlistData = wishlistRes.ok ? await wishlistRes.json() : { productIds: [] }
        const productIds = wishlistData.productIds || []
        setWishlistCount(productIds.length)
      } catch (error) {
        console.error('Error fetching counts:', error)
        setCartCount(0)
        setWishlistCount(0)
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
