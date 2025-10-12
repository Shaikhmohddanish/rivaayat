"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getColorByName } from '@/lib/product-options'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react"
import type { Product, ProductVariant } from "@/lib/types"

interface BasicQuickViewModalProps {
  product: (Product & { _id: string }) | null
  open: boolean
  onClose: () => void
}

export function BasicQuickViewModal({ product, open, onClose }: BasicQuickViewModalProps) {
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  useEffect(() => {
    if (product && open) {
      // Reset state when product changes and modal opens
      setCurrentImageIndex(0)
      setQuantity(1)

      // Set default selections if available
      if (product.variations) {
        // Find first color with available stock
        const availableColor = product.variations.colors.find(color => {
          return product.variations.variants.some(v => v.color === color && v.stock > 0)
        })
        
        setSelectedColor(availableColor || product.variations.colors[0] || "")
        
        // Find first size with available stock for the selected color
        const availableSize = product.variations.sizes.find(size => {
          const variant = product.variations.variants.find(
            v => v.color === (availableColor || product.variations.colors[0]) && v.size === size
          )
          return variant && variant.stock > 0
        })
        
        setSelectedSize(availableSize || product.variations.sizes[0] || "")
      }
    }
  }, [product, open])

  if (!product) return null

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      alert("Please select color and size")
      return
    }
    
    const selectedVariant = product.variations.variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    )
    
    if (!selectedVariant || selectedVariant.stock < quantity) {
      alert("Not enough stock available")
      return
    }
    
    alert(`Added to cart: ${product.name} - Color: ${selectedColor}, Size: ${selectedSize}, Quantity: ${quantity}`)
    onClose()
  }
  
  // Get available sizes for selected color (with stock > 0)
  const availableSizes = selectedColor ? product.variations.sizes.filter(size => {
    const variant = product.variations.variants.find(
      v => v.color === selectedColor && v.size === size
    )
    return variant && variant.stock > 0
  }) : []

  // Get available colors (with stock > 0)
  const availableColors = product.variations.colors.filter(color => {
    return product.variations.variants.some(v => v.color === color && v.stock > 0)
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
              <Image
                src={product.images[currentImageIndex]?.url || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <p className="text-2xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
            <p className="text-muted-foreground">{product.description}</p>

            {/* Color Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Select 
                value={selectedColor} 
                onValueChange={setSelectedColor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select color">
                    {selectedColor && (
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: getColorByName(selectedColor).hex }}
                        />
                        <span>{selectedColor}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableColors.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: getColorByName(color).hex }}
                        />
                        <span>{color}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Size</label>
              <Select 
                value={selectedSize} 
                onValueChange={setSelectedSize}
                disabled={availableSizes.length === 0 || !selectedColor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.map((size) => {
                    const stockForSize = product.variations.variants
                      .find(v => v.color === selectedColor && v.size === size)?.stock || 0
                    
                    return (
                      <SelectItem key={size} value={size}>
                        <div className="flex items-center justify-between w-full">
                          <span>{size}</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {stockForSize} in stock
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold mb-2">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <Button onClick={handleAddToCart} className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}