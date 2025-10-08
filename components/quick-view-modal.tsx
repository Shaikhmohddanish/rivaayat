"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react"
import type { Product } from "@/lib/types"

interface QuickViewModalProps {
  product: (Product & { _id: string }) | null
  open: boolean
  onClose: () => void
}

export function QuickViewModal({ product, open, onClose }: QuickViewModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])

  useEffect(() => {
    if (product) {
      // Reset state when product changes
      setCurrentImageIndex(0)
      setQuantity(1)

      const colors = [...new Set(product.variations?.variants?.map((v) => v.color) || [])]
      const sizes = [...new Set(product.variations?.variants?.map((v) => v.size) || [])]

      setAvailableColors(colors)
      setAvailableSizes(sizes)

      // Set default selections
      setSelectedColor(colors[0] || "")
      setSelectedSize(sizes[0] || "")
    }
  }, [product])

  useEffect(() => {
    if (product && selectedColor) {
      const sizesForColor =
        product.variations?.variants?.filter((v) => v.color === selectedColor).map((v) => v.size) || []
      setAvailableSizes([...new Set(sizesForColor)])

      // Reset size if current selection is not available
      if (!sizesForColor.includes(selectedSize)) {
        setSelectedSize(sizesForColor[0] || "")
      }
    }
  }, [selectedColor, product, selectedSize])

  if (!product) return null

  const handleAddToCart = () => {
    if (!session) {
      router.push("/auth/login")
      return
    }

    if (!selectedColor || !selectedSize) {
      alert("Please select color and size")
      return
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity,
      color: selectedColor,
      size: selectedSize,
      image: product.images[0]?.url || "",
    }

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
    window.dispatchEvent(new Event("cartUpdated"))
    alert("Added to cart!")
    onClose()
  }

  const handleBuyNow = () => {
    if (!session) {
      router.push("/auth/login")
      return
    }

    handleAddToCart()
    router.push("/cart")
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
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
            <p className="text-2xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
            <p className="text-muted-foreground">{product.description}</p>

            {/* Color Selection */}
            {availableColors.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 rounded-md border-2 text-sm ${
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
            {availableSizes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-2">Size</label>
                <div className="flex gap-2 flex-wrap">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 rounded-md border-2 text-sm ${
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <div className="flex gap-2">
                <Button onClick={handleAddToCart} className="flex-1">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="icon" aria-label="Add to Wishlist">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleBuyNow} variant="secondary" className="w-full">
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
