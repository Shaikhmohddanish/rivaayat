"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { getCachedCart, updateCartCache } from "@/lib/cart-cache"
import { getCachedWishlist, updateWishlistCache } from "@/lib/wishlist-cache"

interface CartWishlistContextType {
  cartCount: number
  wishlistCount: number
  refreshCart: () => Promise<void>
  refreshWishlist: () => Promise<void>
  isLoading: boolean
}

const CartWishlistContext = createContext<CartWishlistContextType>({
  cartCount: 0,
  wishlistCount: 0,
  refreshCart: async () => {},
  refreshWishlist: async () => {},
  isLoading: true,
})

export function useCartWishlist() {
  return useContext(CartWishlistContext)
}

export function CartWishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Minimum time between API calls (5 seconds)
  const MIN_FETCH_INTERVAL = 5000

  const refreshCart = useCallback(async () => {
    if (status !== "authenticated" || !session) {
      setCartCount(0)
      return
    }

    // Try cache first
    const cached = getCachedCart()
    if (cached) {
      const count = cached.items.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(count)
    }

    // Only fetch if enough time has passed
    const now = Date.now()
    if (now - lastFetch < MIN_FETCH_INTERVAL && cached) {
      return
    }

    try {
      const res = await fetch("/api/cart", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const items = data.items || []
        const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        setCartCount(count)
        updateCartCache(items)
        setLastFetch(now)
      }
    } catch (error) {
      console.debug("Failed to fetch cart:", error)
    }
  }, [session, status, lastFetch])

  const refreshWishlist = useCallback(async () => {
    if (status !== "authenticated" || !session) {
      setWishlistCount(0)
      return
    }

    // Try cache first
    const cached = getCachedWishlist()
    if (cached) {
      setWishlistCount(cached.productIds.length)
    }

    // Only fetch if enough time has passed
    const now = Date.now()
    if (now - lastFetch < MIN_FETCH_INTERVAL && cached) {
      return
    }

    try {
      const res = await fetch("/api/wishlist", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const productIds = data.productIds || []
        setWishlistCount(productIds.length)
        updateWishlistCache(productIds)
        setLastFetch(now)
      }
    } catch (error) {
      console.debug("Failed to fetch wishlist:", error)
    }
  }, [session, status, lastFetch])

  // Initial load
  useEffect(() => {
    if (status === "loading") return

    const loadCounts = async () => {
      setIsLoading(true)
      await Promise.all([refreshCart(), refreshWishlist()])
      setIsLoading(false)
    }

    loadCounts()
  }, [status, session])

  // Listen for update events
  useEffect(() => {
    const handleCartUpdate = () => {
      refreshCart()
    }

    const handleWishlistUpdate = () => {
      refreshWishlist()
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    window.addEventListener("wishlistUpdated", handleWishlistUpdate)

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate)
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate)
    }
  }, [refreshCart, refreshWishlist])

  const value = {
    cartCount,
    wishlistCount,
    refreshCart,
    refreshWishlist,
    isLoading,
  }

  return <CartWishlistContext.Provider value={value}>{children}</CartWishlistContext.Provider>
}
