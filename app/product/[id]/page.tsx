"use client"

import { use, useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Product } from "@/lib/types"

async function getProduct(id: string) {
  // The API already implements Redis caching, so we don't need to cache here
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products/${id}`, {
    cache: "no-store", // Use Redis caching instead of Next.js cache
  })
  if (!response.ok) return null
  return response.json()
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()

  // Load product
  useEffect(() => {
    getProduct(id).then((data) => {
      setProduct(data)
      if (data) {
        setSelectedColor(data.variations?.colors[0] || "")
        setSelectedSize(data.variations?.sizes[0] || "")
      }
      setLoading(false)
    })
  }, [id])

  const handleAddToCart = async () => {
    if (!product) return

    if (!selectedColor || !selectedSize) {
      alert("Please select color and size")
      return
    }

    const cartItem = {
      productId: product._id!,
      name: product.name,
      price: product.price,
      quantity,
      color: selectedColor,
      size: selectedSize,
      image: product.images[0]?.url || "",
    }

    // Get existing cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingIndex = cart.findIndex(
      (item: any) =>
        item.productId === cartItem.productId && item.color === cartItem.color && item.size === cartItem.size,
    )

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity
    } else {
      cart.push(cartItem)
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    alert("Added to cart!")
  }

  const handleBuyNow = async () => {
    if (!selectedColor || !selectedSize) {
      alert("Please select color and size")
      return
    }

    await handleAddToCart()
    router.push("/cart")
  }

  const handleAddToWishlist = () => {
    if (!product) return
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
    if (!wishlist.includes(product._id)) {
      wishlist.push(product._id)
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
      alert("Added to wishlist!")
    } else {
      alert("Already in wishlist")
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
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
            <Image
              src={sortedImages[selectedImage]?.url || "/placeholder.svg?height=600&width=450&query=dress"}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {sortedImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {sortedImages.map((img, index) => (
                <button
                  key={img.publicId}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image
                    src={img.url || "/placeholder.svg?height=100&width=100&query=dress"}
                    alt={`View ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</p>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Color Selection */}
          {product.variations?.colors && product.variations.colors.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {product.variations.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-md border-2 transition-colors ${
                      selectedColor === color
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.variations?.sizes && product.variations.sizes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2">Size</label>
              <div className="flex gap-2 flex-wrap">
                {product.variations.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-md border-2 transition-colors ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
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
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
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
            <Button onClick={handleAddToWishlist} variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Available in {product.variations?.colors?.length || 0} colors and {product.variations?.sizes?.length || 0}{" "}
              sizes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
