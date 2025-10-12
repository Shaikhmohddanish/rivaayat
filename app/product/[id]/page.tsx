"use client"

import { use, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Check as CheckIcon, Truck, Star } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Product } from "@/lib/types"
import { getColorByName } from "@/lib/product-options"
import { useToast } from "@/hooks/use-toast"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

async function getProduct(id: string) {
  // Direct database call without caching
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products/${id}`, {
    cache: "no-store", // Force fresh data from database
  })
  if (!response.ok) return null
  return response.json()
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Load product
  useEffect(() => {
    getProduct(id).then((data) => {
      setProduct(data)
      if (data) {
        // Find first available color with stock > 0
        const firstAvailableColor = data.variations?.colors.find((color: string) => {
          return data.variations.variants.some((v: any) => v.color === color && v.stock > 0)
        }) || data.variations?.colors[0] || ""
        
        // Find first available size for that color with stock > 0
        const firstAvailableSize = data.variations?.sizes.find((size: string) => {
          return data.variations.variants.some((v: any) => 
            v.color === firstAvailableColor && v.size === size && v.stock > 0
          )
        }) || data.variations?.sizes[0] || ""
        
        setSelectedColor(firstAvailableColor)
        setSelectedSize(firstAvailableSize)
        
        // Check wishlist status
        if (session) {
          fetch('/api/wishlist')
            .then(res => res.ok ? res.json() : { productIds: [] })
            .then(wishlistData => {
              setIsInWishlist(wishlistData.productIds?.includes(data._id))
            })
            .catch(err => {
              console.error("Error fetching wishlist:", err)
            })
        }
      }
      setLoading(false)
    })
  }, [id])

  const handleAddToCart = async () => {
    if (!product) return
    
    if (!session) {
      router.push("/auth/login")
      return
    }

    if (!selectedColor || !selectedSize) {
      toast({
        title: "Selection needed",
        description: "Please select both color and size",
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
        title: "Out of stock",
        description: "Not enough stock available for this variant",
        variant: "destructive"
      })
      return
    }

    const cartItem = {
      productId: product._id!,
      name: product.name,
      price: product.price,
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
  }

  const handleBuyNow = async () => {
    if (!session) {
      router.push("/auth/login")
      return
    }
    
    if (!selectedColor || !selectedSize) {
      toast({
        title: "Selection needed",
        description: "Please select both color and size",
        variant: "destructive"
      })
      return
    }

    await handleAddToCart()
    router.push("/cart")
  }

  const handleToggleWishlist = async () => {
    if (!product) return
    
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
      
      // Show appropriate toast
      if (isNowInWishlist) {
        toast({
          title: "Added to wishlist",
          description: product.name,
          variant: "default",
          className: "bg-pink-50 border-pink-200 text-pink-800"
        })
      } else {
        toast({
          title: "Removed from wishlist",
          description: product.name,
          variant: "default"
        })
      }
      
      window.dispatchEvent(new Event("wishlistUpdated"))
    } catch (error) {
      console.error('Error updating wishlist:', error)
      toast({
        title: "Error",
        description: "Could not update wishlist",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center">Product not found</p>
      </div>
    )
  }

  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shop">Shop</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground max-w-[200px] truncate">
                {product.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-muted">
              <Image
                src={sortedImages[selectedImage]?.url || "/placeholder.svg?height=600&width=450&query=dress"}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              
              {sortedImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev + 1) % sortedImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails */}
            {sortedImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {sortedImages.map((img, index) => (
                  <button
                    key={img.publicId}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-24 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                      index === selectedImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={img.url || "/placeholder.svg?height=100&width=100&query=dress"}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= 4.4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.4</span>
                <span className="text-sm text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">2k Ratings</span>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <p className="text-2xl font-bold">₹{product.price.toFixed(0)}</p>
                <p className="text-lg text-muted-foreground line-through">₹3999</p>
                <p className="text-green-600 font-medium">(82% OFF)</p>
              </div>
              
              <p className="text-green-600 text-sm">inclusive of all taxes</p>
            </div>

            {/* Color Selection */}
            {product.variations?.colors.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">SELECT COLOR</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variations.colors.map((color: string) => {
                    const colorInfo = getColorByName(color);
                    const totalStock = product.variations.variants
                      .filter(v => v.color === color)
                      .reduce((sum: number, v) => sum + (v.stock || 0), 0);
                      
                    const isOutOfStock = totalStock <= 0;
                    
                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          setSelectedColor(color);
                          
                          // Find first available size for this color
                          const availableSize = product.variations.sizes.find((size: string) => {
                            const variant = product.variations.variants.find(
                              v => v.color === color && v.size === size && v.stock > 0
                            );
                            return variant !== undefined;
                          }) || product.variations.sizes[0];
                          
                          if (availableSize) {
                            setSelectedSize(availableSize);
                          }
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
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
                          <CheckIcon className="h-5 w-5 text-white stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Size Selection */}
            {product.variations?.sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">SELECT SIZE</h3>
                  <Button variant="link" className="p-0 h-auto text-primary">SIZE CHART</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.variations.sizes.map((size: string) => {
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
                        className={`min-w-[3.5rem] h-11 rounded-full border flex items-center justify-center px-4 text-base transition-all ${
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

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold mb-2">Quantity</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  -
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    // Check available stock before incrementing
                    const selectedVariant = product.variations.variants.find(
                      v => v.color === selectedColor && v.size === selectedSize
                    );
                    const stock = selectedVariant?.stock || 0;
                    
                    if (quantity < stock) {
                      setQuantity(quantity + 1);
                    }
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleAddToCart} className="flex-1">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button onClick={handleBuyNow} variant="secondary" className="flex-1">
                Buy Now
              </Button>
              <Button onClick={handleToggleWishlist} variant="outline" size="icon">
                <Heart className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <p>Free delivery on orders over ₹999</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Available in {product.variations?.colors?.length || 0} colors and {product.variations?.sizes?.length || 0}{" "}
                sizes
              </p>
            </div>
            
            {/* Product Description */}
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-semibold mb-4">Product Description</h2>
              <div className="prose text-sm text-muted-foreground">
                <p>{product.description || "No description available for this product."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
