"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { getCachedCart, updateCartCache } from "@/lib/cart-cache"
import { getCachedWishlist, updateWishlistCache } from "@/lib/wishlist-cache"

interface CartWishlistContextType {
  cartCount: number
  wishlistCount: number
  refreshCart: (options?: { force?: boolean }) => Promise<void>
  refreshWishlist: (options?: { force?: boolean }) => Promise<void>
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
  const lastCartFetchRef = useRef(0)
  const lastWishlistFetchRef = useRef(0)
  const cartInFlightRef = useRef(false)
  const wishlistInFlightRef = useRef(false)
  const initializedRef = useRef(false)

  const MIN_FETCH_INTERVAL = 5000
  const isAuthenticatedUser = status === "authenticated" && !!session

  const refreshCart = useCallback(async (options: { force?: boolean } = {}) => {
    if (!isAuthenticatedUser) {
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
    if (!options.force && now - lastCartFetchRef.current < MIN_FETCH_INTERVAL && cached) {
      return
    }

    if (cartInFlightRef.current && !options.force) return
    cartInFlightRef.current = true

    try {
      const res = await fetch("/api/cart", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const items = data.items || []
        const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        setCartCount(count)
        updateCartCache(items)
        lastCartFetchRef.current = now
      }
    } catch (error) {
      console.debug("Failed to fetch cart:", error)
    } finally {
      cartInFlightRef.current = false
    }
  }, [isAuthenticatedUser])

  const refreshWishlist = useCallback(async (options: { force?: boolean } = {}) => {
    if (!isAuthenticatedUser) {
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
    if (!options.force && now - lastWishlistFetchRef.current < MIN_FETCH_INTERVAL && cached) {
      return
    }

    if (wishlistInFlightRef.current && !options.force) return
    wishlistInFlightRef.current = true

    try {
      const res = await fetch("/api/wishlist", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const productIds = data.productIds || []
        setWishlistCount(productIds.length)
        updateWishlistCache(productIds)
        lastWishlistFetchRef.current = now
      }
    } catch (error) {
      console.debug("Failed to fetch wishlist:", error)
    } finally {
      wishlistInFlightRef.current = false
    }
  }, [isAuthenticatedUser])

  // Initial load
  useEffect(() => {
    if (status === "loading") return

    if (!isAuthenticatedUser) {
      initializedRef.current = false
      setCartCount(0)
      setWishlistCount(0)
      setIsLoading(false)
      return
    }

    if (initializedRef.current) return
    initializedRef.current = true

    const loadCounts = async () => {
      setIsLoading(true)
      await Promise.all([refreshCart({ force: true }), refreshWishlist({ force: true })])
      setIsLoading(false)
    }

    loadCounts()
  }, [status, isAuthenticatedUser, refreshCart, refreshWishlist])

  // Listen for update events
  useEffect(() => {
    const handleCartUpdate = () => {
      refreshCart({ force: true })
    }

    const handleWishlistUpdate = () => {
      refreshWishlist({ force: true })
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
