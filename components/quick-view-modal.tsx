"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Check as CheckIcon } from "lucide-react"
import { getColorByName } from "@/lib/product-options"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"

interface QuickViewModalProps {
  product: (Product & { _id: string }) | null
  open: boolean
  onClose: () => void
}

export function QuickViewModal({ product, open, onClose }: QuickViewModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const originalPrice = product?.originalPrice ?? product?.mrp ?? product?.price ?? 0
  const discountedPrice = product?.discountedPrice ?? product?.price ?? originalPrice
  const hasDiscount = Boolean(product && originalPrice && discountedPrice && discountedPrice < originalPrice)
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0
  useEffect(() => {
    if (product && open) {
      // Reset state when product changes and modal opens
      setCurrentImageIndex(0)
      setQuantity(1)
      
      // Check if product is in wishlist using API
      fetch('/api/wishlist')
        .then(res => res.ok ? res.json() : { productIds: [] })
        .then(wishlistData => {
          setIsInWishlist(wishlistData.productIds?.includes(product._id))
        })
        .catch(err => {
          console.error("Error fetching wishlist:", err)
        })
      
      // Find first available color with stock > 0
      const firstAvailableColor = product.variations.colors.find(color => {
        return product.variations.variants.some(v => v.color === color && v.stock > 0)
      }) || product.variations.colors[0] || ""
      
      // Find first available size for that color with stock > 0
      const firstAvailableSize = product.variations.sizes.find(size => {
        return product.variations.variants.some(v => 
          v.color === firstAvailableColor && v.size === size && v.stock > 0
        )
      }) || product.variations.sizes[0] || ""
      
      setSelectedColor(firstAvailableColor)
      setSelectedSize(firstAvailableSize)
    }
  }, [product, open])

  if (!product) return null

  // Calculate current stock for selected variant
  const currentStock = selectedColor && selectedSize 
    ? product.variations.variants.find(
        v => v.color === selectedColor && v.size === selectedSize
      )?.stock || 0
    : 0

  const handleAddToCart = async () => {
    if (!session) {
      router.push("/auth/login")
      return
    }

    if (!selectedColor || !selectedSize) {
      toast({
        title: "Selection Required",
        description: "Please select color and size",
        variant: "destructive"
      })
      return
    }
    
    // Check inventory
    const selectedVariant = product.variations.variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );
    
    if (!selectedVariant || !selectedVariant.stock || selectedVariant.stock < quantity) {
      toast({
        title: "Stock Unavailable",
        description: "Not enough stock available for this variant",
        variant: "destructive"
      })
      return
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: discountedPrice,
      quantity,
      variant: {
        color: selectedColor,
        size: selectedSize
      },
      image: product.images[0]?.url || "",
    }

    try {
      // Add item to cart via API
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItem),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add to cart')
      }
      
      // Trigger event to update cart count in header
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: "Could not add item to cart",
        variant: "destructive"
      })
      return
    }
    
    toast({
      title: "Added to cart",
      description: `${product.name} - ${selectedColor}, ${selectedSize}`,
      variant: "default",
      className: "bg-green-50 border-green-200 text-green-800"
    })
    
    onClose()
  }

  const handleBuyNow = async () => {
    if (!session) {
      router.push("/auth/login")
      return
    }

    await handleAddToCart()
    router.push("/cart")
  }
  
  const handleWishlist = async () => {
    if (!session) {
      router.push("/auth/login")
      return
    }
    
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: product._id }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update wishlist')
      }
      
      const data = await response.json()
      
      // Update UI state
      const isNowInWishlist = data.productIds.includes(product._id)
      setIsInWishlist(isNowInWishlist)
      
      // Broadcast event for other components
      window.dispatchEvent(new Event("wishlistUpdated"))
      
      // Show toast
      toast({
        title: isNowInWishlist ? "Added to wishlist" : "Removed from wishlist",
        description: product.name,
        variant: "default",
        className: "bg-gray-50 border-gray-200"
      })
    } catch (error) {
      console.error('Error updating wishlist:', error)
      toast({
        title: "Error",
        description: "Could not update wishlist",
        variant: "destructive"
      })
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev: number) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev: number) => (prev - 1 + product.images.length) % product.images.length)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-muted">
              <Image
                src={product.images[currentImageIndex]?.url || "/placeholder.svg?height=600&width=450&query=dress"}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                      index === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image.url || "/placeholder.svg?height=80&width=80&query=dress"}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold">₹{discountedPrice.toFixed(0)}</p>
              {hasDiscount && (
                <span className="text-muted-foreground line-through">₹{originalPrice.toFixed(0)}</span>
              )}
              {discountPercent > 0 && (
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{product.description}</p>

            {/* Simple Variation Selection */}
            {product.variations && (
              <div className="space-y-4">
                {/* Color Selection */}
                {product.variations.colors.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {product.variations.colors.map((color) => {
                        const colorInfo = getColorByName(color);
                        const totalStock = product.variations.variants
                          .filter(v => v.color === color)
                          .reduce((sum, v) => sum + (v.stock || 0), 0);
                          
                        const isOutOfStock = totalStock <= 0;
                        
                        return (
                          <button
                            key={color}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => {
                              setSelectedColor(color);
                              
                              // Find first available size for this color
                              const availableSize = product.variations.sizes.find(size => {
                                const variant = product.variations.variants.find(
                                  v => v.color === color && v.size === size && v.stock > 0
                                );
                                return variant !== undefined;
                              }) || product.variations.sizes[0];
                              
                              if (availableSize) {
                                setSelectedSize(availableSize);
                              }
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              color === selectedColor
                                ? "ring-2 ring-primary ring-offset-2"
                                : isOutOfStock 
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                            }`}
                            style={{ backgroundColor: colorInfo.hex }}
                            aria-label={`Color: ${color}`}
                          >
                            {color === selectedColor && (
                              <CheckIcon className="h-4 w-4 text-white stroke-[3]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Size Selection */}
                {product.variations.sizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Select Size</label>
                    <div className="flex flex-wrap gap-2">
                      {product.variations.sizes.map((size) => {
                        const stockForSize = selectedColor ? 
                          product.variations.variants
                            .find(v => v.color === selectedColor && v.size === size)?.stock || 0
                          : 0;
                          
                        const isOutOfStock = stockForSize <= 0;
                        
                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => setSelectedSize(size)}
                            className={`min-w-12 h-10 rounded-full border flex items-center justify-center px-3 transition-all ${
                              size === selectedSize
                                ? "bg-primary text-white border-primary"
                                : isOutOfStock
                                  ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                  : "bg-background hover:border-primary"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => Math.min(prev + 1, currentStock))}
                  disabled={currentStock > 0 && quantity >= currentStock}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
                {currentStock > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {currentStock} available
                  </span>
                )}
              </div>
            </div>
            
            {/* Delivery Options */}
            <div className="border rounded-md p-4 bg-muted/20">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                  <path d="M11 18h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h4"></path>
                  <circle cx="18" cy="18" r="2"></circle>
                  <circle cx="7" cy="18" r="2"></circle>
                </svg>
                DELIVERY OPTIONS
              </h3>
              <div className="text-sm text-muted-foreground">
                Free delivery on orders above ₹500
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleAddToCart} 
                  variant="outline"
                  className="w-full border-2 border-primary text-primary hover:bg-primary/10 h-12 text-base font-medium"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  ADD TO BAG
                </Button>
                <Button 
                  onClick={handleBuyNow} 
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-medium"
                >
                  BUY NOW
                </Button>
              </div>
              <Button 
                onClick={handleWishlist} 
                variant={isInWishlist ? "secondary" : "outline"}
                className={`w-full border-2 h-12 text-base font-medium ${
                  isInWishlist ? "border-pink-200 bg-pink-50 text-pink-600" : ""
                }`}
                aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`mr-2 h-5 w-5 ${isInWishlist ? "fill-pink-500" : ""}`} />
                {isInWishlist ? "WISHLISTED" : "WISHLIST"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
