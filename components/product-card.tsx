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
import { updateWishlistCache } from "@/lib/wishlist-cache"

interface ProductCardProps {
  product: Product & { _id: string }
  onQuickView?: (product: Product & { _id: string }) => void
  wishlistProductIds?: string[]
  onWishlistChange?: (productIds: string[]) => void
}

export function ProductCard({ product, onQuickView, wishlistProductIds, onWishlistChange }: ProductCardProps) {
  const { data: session, status } = useSession()
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
    // 🚀 OPTIMIZATION Item 7: Use passed wishlist instead of fetching
    if (wishlistProductIds !== undefined) {
      setIsWishlisted(wishlistProductIds.includes(product._id))
    } else {
      // Fallback to individual fetch if not provided (backward compatibility)
      const checkWishlist = async () => {
        if (status !== "authenticated" || !session) return
        
        try {
          const res = await fetch("/api/wishlist", { cache: "no-store" })
          if (!res.ok) return
          const data = await res.json()
          setIsWishlisted(Boolean(data.productIds?.includes(product._id)))
        } catch (error) {
          console.debug("Failed to check wishlist status:", error)
        }
      }

      checkWishlist()
    }

    if (product.variations?.colors?.length) setSelectedColor(product.variations.colors[0])
    if (product.variations?.sizes?.length) setSelectedSize(product.variations.sizes[0])
  }, [product._id, product.variations, session, status, wishlistProductIds])

  const checkStock = (color: string, size: string) => {
    const v = product.variations?.variants?.find((x) => x.color === color && x.size === size)
    return v?.stock ?? 0
  }

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Check authentication status
    if (status === "loading") return
    if (status === "unauthenticated" || !session) {
      return router.push("/auth/login")
    }

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      })
      if (!response.ok) throw new Error("wishlist")
      const data = await response.json()
      const nowIn = Boolean(data.productIds?.includes(product._id))
      const freshIds = data.productIds || []
      setIsWishlisted(nowIn)
      
      // 🚀 OPTIMIZATION Item 7 & 11: Update parent state and cache
      if (onWishlistChange) {
        onWishlistChange(freshIds)
      }
      updateWishlistCache(freshIds)
      
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
    
    // Check authentication status
    if (status === "loading") return
    if (status === "unauthenticated" || !session) {
      return router.push("/auth/login")
    }

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
      return true // Return success
    } catch (err) {
      toast({ title: "Error", description: "Could not add item to cart", variant: "destructive" })
      return false // Return failure
    }
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Check authentication status
    if (status === "loading") return
    if (status === "unauthenticated" || !session) {
      return router.push("/auth/login")
    }

    const hasOptions =
      (product.variations?.colors?.length ?? 0) > 0 || (product.variations?.sizes?.length ?? 0) > 0

    // For products with variations, open quick view modal instead of inline selection
    if (hasOptions) {
      if (onQuickView) {
        onQuickView(product)
        return
      }
      // Fallback to showing variations if quick view is not available
      setShowVariations(true)
      return toast({ title: "Select options", description: "Choose color and size before buying" })
    }

    // For products without variations, proceed with purchase
    const cartItem = {
      productId: product._id,
      name: product.name,
      price: discountedPrice,
      image: product.images?.[0]?.url || "",
      quantity: 1,
      variant: { color: "", size: "" },
    }

    try {
      // Add to cart first
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem),
      })
      
      if (!res.ok) {
        toast({ title: "Error", description: "Could not add item to cart", variant: "destructive" })
        return
      }
      
      // Wait a moment for cart to update, then redirect
      window.dispatchEvent(new Event("cartUpdated"))
      
      // Small delay to ensure cart is updated before redirect
      setTimeout(() => {
        router.push("/checkout")
      }, 300)
      
    } catch (err) {
      toast({ title: "Error", description: "Could not process your request", variant: "destructive" })
    }
  }

  const hasOptions =
    (product.variations?.colors?.length ?? 0) > 0 || (product.variations?.sizes?.length ?? 0) > 0

  return (
    <Link href={`/product/${product.slug ?? product._id}`} className="block">
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-gray-100 rounded-lg max-w-sm p-0">
        <div className="relative aspect-4/5 overflow-hidden rounded-t-lg">
          <Image
            src={product.images?.[0]?.url || "/placeholder.svg?height=400&width=300&query=dress"}
            alt={product.name}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Desktop: Show on hover, Mobile: Always visible */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.preventDefault()
                onQuickView?.(product)
              }}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white active:scale-95 touch-target transition-all"
              aria-label={`Quick view ${product.name}`}
            >
              <Eye className="h-5 w-5 sm:h-4 sm:w-4 text-gray-600" />
            </button>
            <button
              onClick={handleAddToCart}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white active:scale-95 touch-target transition-all"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart className="h-5 w-5 sm:h-4 sm:w-4 text-gray-600" />
            </button>
            <button
              onClick={handleAddToWishlist}
              className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white active:scale-95 touch-target transition-all ${
                isWishlisted ? "text-rose-500" : "text-gray-600"
              }`}
              aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            >
              <Heart className={`h-5 w-5 sm:h-4 sm:w-4 ${isWishlisted ? "fill-current" : ""}`} />
            </button>
          </div>

          {(hasOptions || hasDiscount) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {hasOptions && (
                <div className="bg-primary/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                  Options
                </div>
              )}
              {hasDiscount && (
                <div className="bg-emerald-600/90 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                  {discountPercent}% off
                </div>
              )}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium text-base mb-1 line-clamp-1 text-gray-900 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{product.description}</p>

          {showVariations && hasOptions && (
            <div className="space-y-3 mb-4">
              {product.variations?.colors?.length ? (
                <div>
                  <div className="text-xs text-gray-500 mb-1.5 font-medium">Select Color</div>
                  <div className="flex flex-wrap gap-2">
                    {product.variations.colors.map((color) => {
                      const disabled = Boolean(selectedSize && checkStock(color, selectedSize) <= 0)
                      return (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.preventDefault()
                            if (!disabled) setSelectedColor(color)
                          }}
                          disabled={disabled}
                          className={`w-8 h-8 rounded-full border relative flex items-center justify-center ${
                            selectedColor === color
                              ? "ring-2 ring-primary ring-offset-2 border-white"
                              : "border-gray-200 hover:border-primary"
                          } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-110 transition-transform"}`}
                          style={{
                            backgroundColor:
                              color === "Emerald Green" ? "#50C878" : color === "Deep Maroon" ? "#800000" : color.toLowerCase(),
                          }}
                          title={color}
                          type="button"
                        >
                          {selectedColor === color && <span className="text-white drop-shadow-md text-xs">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {product.variations?.sizes?.length ? (
                <div>
                  <div className="text-xs text-gray-500 mb-1.5 font-medium">Select Size</div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variations.sizes.map((size) => {
                      const disabled = Boolean(selectedColor && checkStock(selectedColor, size) <= 0)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            if (!disabled) setSelectedSize(size)
                          }}
                          disabled={disabled}
                          className={`min-w-10 h-7 rounded border text-xs font-medium ${
                            selectedSize === size
                              ? "bg-primary text-white border-primary"
                              : "border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
                          } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary transition-colors"}`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-col text-gray-900">
              <p className="text-lg font-semibold">₹{discountedPrice.toFixed(2)}</p>
              {hasDiscount && (
                <div className="flex flex-wrap items-baseline gap-1 text-xs">
                  <span className="text-muted-foreground line-through">₹{originalPrice.toFixed(2)}</span>
                  <span className="font-semibold text-emerald-600">({discountPercent}% off)</span>
                </div>
              )}
            </div>
            <Button size="sm" onClick={handleBuyNow} className="bg-primary hover:bg-primary/90 text-white">
              Buy Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
