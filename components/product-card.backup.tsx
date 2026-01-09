"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Heart, ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  product: Product & { _id: string }
  onQuickView?: (product: Product & { _id: string }) => void
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showVariations, setShowVariations] = useState(false)
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const originalPrice = product.originalPrice ?? product.mrp ?? product.price
  const discountedPrice = product.discountedPrice ?? product.price
  const hasDiscount = Boolean(originalPrice && discountedPrice && discountedPrice < originalPrice)
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0

  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store", next: { revalidate: 0 } })
        if (!res.ok) return
        const data = await res.json()
        setIsWishlisted(Boolean(data.productIds?.includes(product._id)))
      } catch (_) {}
    }

    if (session) checkWishlist()

    if (product.variations?.colors?.length) setSelectedColor(product.variations.colors[0])
    if (product.variations?.sizes?.length) setSelectedSize(product.variations.sizes[0])
  }, [product._id, product.variations, session])

  const checkStock = (color: string, size: string) => {
    const v = product.variations?.variants?.find((x) => x.color === color && x.size === size)
    return v?.stock ?? 0
  }

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) return router.push("/auth/login")

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      })
      if (!response.ok) throw new Error("wishlist")
      const data = await response.json()
      const nowIn = Boolean(data.productIds?.includes(product._id))
      setIsWishlisted(nowIn)
      window.dispatchEvent(new Event("wishlistUpdated"))
      toast({
        title: nowIn ? "Added to wishlist" : "Removed from wishlist",
        description: product.name,
        className: "bg-gray-50 border-gray-200 text-black",
      })
    } catch (err) {
      toast({ title: "Error", description: "Could not update wishlist", variant: "destructive" })
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) return router.push("/auth/login")

    const hasOptions =
      (product.variations?.colors?.length ?? 0) > 0 || (product.variations?.sizes?.length ?? 0) > 0

    if (hasOptions && (!selectedColor || !selectedSize)) {
      setShowVariations(true)
      return toast({ title: "Select options", description: "Choose color and size" })
    }

    if (hasOptions && checkStock(selectedColor, selectedSize) <= 0) {
      return toast({ title: "Out of stock", description: "Selected variant is unavailable", variant: "destructive" })
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: discountedPrice,
      image: product.images?.[0]?.url || "",
      quantity: 1,
      variant: { color: selectedColor || "", size: selectedSize || "" },
    }

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem),
      })
      if (!res.ok) throw new Error("cart")
      window.dispatchEvent(new Event("cartUpdated"))
      setShowVariations(false)
      toast({
        title: "Added to cart",
        description: product.name,
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (err) {
      toast({ title: "Error", description: "Could not add item to cart", variant: "destructive" })
    }
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    await handleAddToCart(e)
    // If cart add succeeded, go to checkout
    router.push("/checkout")
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    onQuickView?.(product)
  }

  const toggleVariations = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowVariations((prev) => !prev)
  }

  const hasOptions =
    (product.variations?.colors?.length ?? 0) > 0 || (product.variations?.sizes?.length ?? 0) > 0

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-gray-100 rounded-xl max-w-sm">
      <div className="p-4 pb-0">
        <h3 className="font-medium text-xl mb-1 text-pink-500 group-hover:text-pink-600 transition-colors duration-300 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </div>

      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={product.images[0]?.url || "/placeholder.svg?height=400&width=300&query=dress"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleQuickView}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            aria-label="Quick View"
          >
            <Eye className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={toggleVariations}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            aria-label="Add to Cart"
          >
            <ShoppingCart className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={handleAddToWishlist}
            className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors ${
              isWishlisted ? "text-pink-500" : "text-gray-700"
            }`}
            aria-label="Add to Wishlist"
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
        </div>
        
        {/* Show variation badge if available */}
        {(hasOptions || hasDiscount) && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasOptions && (
              <div className="bg-primary/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                Options
              </div>
            )}
            {hasDiscount && (
              <div className="bg-emerald-600/90 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                {discountPercent}% OFF
              </div>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-4 pt-3">
        {/* Title and description moved to top */}
        
        {/* Variations selection */}
        {(product.variations?.colors?.length > 0 || product.variations?.sizes?.length > 0) && (
          <div className="space-y-3 mb-4">
            {product.variations?.colors && product.variations.colors.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1.5 font-medium">Select Color</div>
                <div className="flex flex-wrap gap-2">
                  {product.variations.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        if (!selectedSize || checkStock(color, selectedSize) > 0) {
                          setSelectedColor(color)
                        }
                      }}
                      disabled={Boolean(selectedSize && checkStock(color, selectedSize) <= 0)}
                      className={`
                        w-8 h-8 rounded-full border relative flex items-center justify-center
                        ${selectedColor === color 
                          ? 'ring-2 ring-primary ring-offset-2 border-white' 
                          : 'border-gray-200 hover:border-primary'}
                        ${selectedSize && checkStock(color, selectedSize) <= 0 
                          ? 'opacity-40 cursor-not-allowed' 
                          : 'hover:scale-110 transition-transform shadow-sm'}
                      `}
                      style={{ 
                        backgroundColor: color === "Emerald Green" ? "#50C878" : 
                                       color === "Deep Maroon" ? "#800000" : 
                                       color.toLowerCase()
                      }}
                      title={color}
                    >
                      {selectedColor === color && (
                        <span className="text-white drop-shadow-md text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {product.variations?.sizes && product.variations.sizes.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1.5 font-medium">Select Size</div>
                <div className="flex flex-wrap gap-1.5">
                  {product.variations.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        if (!selectedColor || checkStock(selectedColor, size) > 0) {
                          setSelectedSize(size)
                        }
                      }}
                      disabled={Boolean(selectedColor && checkStock(selectedColor, size) <= 0)}
                      className={`
                        min-w-[2.5rem] h-7 rounded border text-xs font-medium
                        ${selectedSize === size 
                          ? 'bg-primary text-white border-primary' 
                          : 'border-gray-200 text-gray-700 hover:border-primary hover:text-primary'}
                        ${selectedColor && checkStock(selectedColor, size) <= 0 
                          ? 'opacity-40 cursor-not-allowed' 
                          : 'hover:border-primary transition-colors'}
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-col text-gray-900">
              <p className="text-xl font-bold">₹{discountedPrice.toFixed(2)}</p>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{originalPrice.toFixed(2)} ({discountPercent}% off)
                </span>
              )}
            </div>
          <Button 
            size="sm" 
            onClick={handleBuyNow}
            className="bg-pink-500 hover:bg-pink-600 text-white font-medium px-6 py-2 h-9 rounded-full transition-colors"
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
