"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { QuickViewModal } from "@/components/quick-view-modal"
import Link from "next/link"
import type { Product } from "@/lib/types"

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [products, setProducts] = useState<(Product & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [quickViewProduct, setQuickViewProduct] = useState<(Product & { _id: string }) | null>(null)

  useEffect(() => {
    async function fetchWishlist() {
      try {
        // Get the wishlist from the API
        const wishlistRes = await fetch('/api/wishlist')
        
        if (!wishlistRes.ok) {
          setLoading(false)
          return
        }
        
        const wishlistData = await wishlistRes.json()
        const productIds = wishlistData.productIds || []
        setWishlist(productIds)
        
        // Fetch product details if we have items
        if (productIds.length > 0) {
          const productPromises = productIds.map((id: string) => 
            fetch(`/api/products/${id}`)
              .then(res => res.json())
              .catch(() => null)
          )
          
          const results = await Promise.all(productPromises)
          setProducts(results.filter(p => p !== null))
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWishlist()
  }, [])

  // Listen for wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = async () => {
      try {
        const wishlistRes = await fetch('/api/wishlist', { cache: 'no-store' })
        
        if (!wishlistRes.ok) {
          setProducts([])
          return
        }
        
        const wishlistData = await wishlistRes.json()
        const productIds = wishlistData.productIds || []
        
        if (productIds.length > 0) {
          const productPromises = productIds.map((id: string) => 
            fetch(`/api/products/${id}`)
              .then(res => res.json())
              .catch(() => null)
          )
          
          const results = await Promise.all(productPromises)
          setProducts(results.filter(p => p !== null))
        } else {
          setProducts([])
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error)
      }
    }

    // Add event listener for wishlist updates
    window.addEventListener('wishlistUpdated', handleWishlistUpdate)
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
    }
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center">Loading...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground">Save items you love for later</p>
          <Link href="/shop" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product._id} 
            product={product}
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      <QuickViewModal 
        product={quickViewProduct} 
        open={!!quickViewProduct} 
        onClose={() => setQuickViewProduct(null)} 
      />
    </div>
  )
}
