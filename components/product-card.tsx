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

  useEffect(() => {
    // Check if product is in wishlist
    const checkWishlist = async () => {
      try {
        console.log("Checking if product is in wishlist:", product._id)
        const res = await fetch('/api/wishlist', { 
          cache: 'no-store',
          next: { revalidate: 0 } 
        })
        
        if (!res.ok) {
          console.error("Wishlist API error:", res.status)
          return
        }
        
        const data = await res.json()
        console.log("Wishlist data:", data)
        
        const isInWishlist = data.productIds?.includes(product._id)
        console.log("Is product wishlisted:", isInWishlist)
        setIsWishlisted(isInWishlist)
      } catch (err) {
        console.error("Error fetching wishlist:", err)
      }
    }
    
    if (session) {
      checkWishlist()
    }
      
    // Set default color and size if available
    if (product.variations?.colors?.length) {
      setSelectedColor(product.variations.colors[0])
    }
    if (product.variations?.sizes?.length) {
      setSelectedSize(product.variations.sizes[0])
    }
  }, [product._id, product.variations, session])

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    console.log("Adding to wishlist:", product._id)
    
    if (!session) {
      console.log("No session, redirecting to login")
      router.push("/auth/login")
      return
    }

    try {
      console.log("Sending POST request to /api/wishlist")
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: product._id }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", response.status, errorText)
        throw new Error('Failed to update wishlist')
      }
      
      const data = await response.json()
      console.log("Wishlist API response:", data)
      
      // Verify if the product is now in the wishlist
      setIsWishlisted(data.productIds.includes(product._id))
      console.log("Product wishlisted status:", data.productIds.includes(product._id))
      
      // Dispatch event to update other components
      window.dispatchEvent(new Event("wishlistUpdated"))
      
      // Show success message
      toast({
        title: data.productIds.includes(product._id) ? "Added to wishlist" : "Removed from wishlist",
        description: product.name,
        variant: "default",
        className: data.productIds.includes(product._id) ? "bg-pink-50 border-pink-200 text-pink-800" : "bg-gray-50 border-gray-200"
      })
    } catch (error) {
      console.error('Error updating wishlist:', error)
      
      // Show error message
      toast({
        title: "Error",
        description: "Could not update wishlist",
        variant: "destructive"
      })
    }
  }

  const toggleVariations = (e: React.MouseEvent) => {
    e.preventDefault()
    if (product.variations?.colors?.length > 0 || product.variations?.sizes?.length > 0) {
      setShowVariations(!showVariations)
    } else {
      handleAddToCart(e)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) {
      router.push("/auth/login")
      return
    }

    // If product has variations but none selected, either show variations or open quick view
    if ((product.variations?.colors?.length > 0 || product.variations?.sizes?.length > 0) 
        && (!selectedColor || !selectedSize) && !showVariations) {
      if (onQuickView) {
        onQuickView(product)
        // Show a toast guiding the user to select options
        toast({
          title: "Select options",
          description: "Please choose color and size options for this product",
          variant: "default"
        })
      } else {
        setShowVariations(true)
      }
      return
    }
    
    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "",
      quantity: 1,
      variant: {
        color: selectedColor || "",
        size: selectedSize || ""
      }
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
      
      // Reset variations display
      setShowVariations(false)
      
      // Show success message
      toast({
        title: "Added to cart",
        description: product.name,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800"
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: "Could not add item to cart",
        variant: "destructive"
      })
    }
  }
  
  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) {
      router.push("/auth/login")
      return
    }
    
    // If product has variations but none selected, show variations
    if ((product.variations?.colors?.length > 0 || product.variations?.sizes?.length > 0) 
        && (!selectedColor || !selectedSize) && !showVariations) {
      setShowVariations(true)
      toast({
        title: "Select options",
        description: "Please choose color and size before buying",
        variant: "default"
      })
      return
    }
    
    try {
      // Add to cart first
      const cartItem = {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || "",
        quantity: 1,
        variant: {
          color: selectedColor || "",
          size: selectedSize || ""
        }
      }
      
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
      
      // Trigger cart update event
      window.dispatchEvent(new Event("cartUpdated"))
      
      // Redirect to checkout page
      router.push("/checkout")
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: "Could not process your request",
        variant: "destructive"
      })
    }
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
            onClick={toggleVariations} 
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
        
        {/* Show variation badge if available */}
        {(product.variations?.colors?.length > 0 || product.variations?.sizes?.length > 0) && (
          <div className="absolute top-2 left-2 bg-primary/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
            Options
          </div>
        )}
      </div>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-foreground group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        {/* Variations selection */}
        {showVariations && (
          <div className="mb-4 py-2 border-t border-b border-border/40 animate-fade-in">
            {product.variations?.colors && product.variations.colors.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1 font-medium">Color:</div>
                <div className="flex flex-wrap gap-1">
                  {product.variations.colors.map((color) => (
                    <Button
                      key={color}
                      variant="outline"
                      size="sm"
                      className={`h-7 px-3 py-0 text-xs ${selectedColor === color ? "bg-primary text-white" : ""}`}
                      onClick={(e) => {
                        e.preventDefault()
                        setSelectedColor(color)
                      }}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {product.variations?.sizes && product.variations.sizes.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1 font-medium">Size:</div>
                <div className="flex flex-wrap gap-1">
                  {product.variations.sizes.map((size) => (
                    <Button
                      key={size}
                      variant="outline"
                      size="sm"
                      className={`h-7 px-3 py-0 text-xs ${selectedSize === size ? "bg-primary text-white" : ""}`}
                      onClick={(e) => {
                        e.preventDefault()
                        setSelectedSize(size)
                      }}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
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
