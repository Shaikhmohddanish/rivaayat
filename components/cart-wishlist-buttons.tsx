"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingCart, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCartWishlist } from "@/components/cart-wishlist-provider"

export function CartWishlistButtons() {
  const { cartCount, wishlistCount } = useCartWishlist()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
