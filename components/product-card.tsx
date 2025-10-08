"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Eye } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product & { _id: string }
  onQuickView?: (product: Product & { _id: string }) => void
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    // Check if product is in wishlist
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
    setIsWishlisted(wishlist.includes(product._id))
  }, [product._id])

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) {
      router.push("/auth/login")
      return
    }

    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
    if (!wishlist.includes(product._id)) {
      wishlist.push(product._id)
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
      setIsWishlisted(true)
      window.dispatchEvent(new Event("wishlistUpdated"))
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) {
      router.push("/auth/login")
      return
    }

    const firstVariant = product.variations?.variants?.[0]
    if (!firstVariant) return

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "",
      color: firstVariant.color,
      size: firstVariant.size,
      quantity: 1,
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingIndex = cart.findIndex(
      (item: any) =>
        item.productId === cartItem.productId && item.color === cartItem.color && item.size === cartItem.size,
    )

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1
    } else {
      cart.push(cartItem)
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) {
      router.push("/auth/login")
      return
    }

    await handleAddToCart(e)
    router.push("/cart")
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onQuickView) {
      onQuickView(product)
    }
  }

  return (
    <Card className="group overflow-hidden elegant-shadow hover:shadow-xl transition-all duration-500 bg-card/80 backdrop-blur-sm border-0 rounded-2xl">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl">
        <Image
          src={product.images[0]?.url || "/placeholder.svg?height=400&width=300&query=dress"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
          <Button 
            size="icon" 
            variant="secondary" 
            onClick={handleQuickView} 
            aria-label="Quick View"
            className="glass-effect hover:bg-white/20 border-white/20 backdrop-blur-md"
          >
            <Eye className="h-4 w-4 text-white" />
            <span className="sr-only">Quick View</span>
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            onClick={handleAddToCart} 
            aria-label="Add to Cart"
            className="glass-effect hover:bg-white/20 border-white/20 backdrop-blur-md"
          >
            <ShoppingCart className="h-4 w-4 text-white" />
            <span className="sr-only">Add to Cart</span>
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            onClick={handleAddToWishlist} 
            aria-label="Add to Wishlist"
            className="glass-effect hover:bg-white/20 border-white/20 backdrop-blur-md"
          >
            <Heart className={`h-4 w-4 text-white ${isWishlisted ? "fill-current text-rose-300" : ""}`} />
            <span className="sr-only">Add to Wishlist</span>
          </Button>
        </div>
        
      </div>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-foreground group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-foreground">₹{product.price.toFixed(2)}</p>
          </div>
          <Button 
            size="sm" 
            onClick={handleBuyNow}
            className="elegant-gradient hover:opacity-90 transition-all duration-300 text-white font-medium px-6"
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
