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
    
    const updateCounts = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
      setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0))
      setWishlistCount(wishlist.length)
    }

    updateCounts()

    // Listen for storage events to update counts when items are added/removed
    window.addEventListener("storage", updateCounts)
    // Custom event for same-tab updates
    window.addEventListener("cartUpdated", updateCounts)
    window.addEventListener("wishlistUpdated", updateCounts)

    return () => {
      window.removeEventListener("storage", updateCounts)
      window.removeEventListener("cartUpdated", updateCounts)
      window.removeEventListener("wishlistUpdated", updateCounts)
    }
  }, [])

  if (!mounted) {
    return (
      <>
        <Link href="/search" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 elegant-hover">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Link>
        <Link href="/wishlist" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative elegant-hover">
          <Heart className="h-5 w-5" />
          <span className="sr-only">Wishlist</span>
        </Link>
        <Link href="/cart" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative elegant-hover">
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">Cart</span>
        </Link>
      </>
    )
  }

  return (
    <>
      <Link href="/search" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 elegant-hover">
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Link>
      <Link href="/wishlist" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative elegant-hover">
        <Heart className="h-5 w-5" />
        {wishlistCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-white border-0 rounded-full"
          >
            {wishlistCount}
          </Badge>
        )}
        <span className="sr-only">Wishlist</span>
      </Link>
      <Link href="/cart" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative elegant-hover">
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-white border-0 rounded-full"
          >
            {cartCount}
          </Badge>
        )}
        <span className="sr-only">Cart</span>
      </Link>
    </>
  )
}