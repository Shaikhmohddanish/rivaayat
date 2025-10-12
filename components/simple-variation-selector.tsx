"use client"

import { useState, useEffect } from 'react'
import { getColorByName } from '@/lib/product-options'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProductVariant } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SimpleVariationSelectorProps {
  product: {
    variations: {
      colors: string[]
      sizes: string[]
      variants: ProductVariant[]
    }
  }
  onVariationChange: (color: string, size: string) => void
  className?: string
}

export function SimpleVariationSelector({ product, onVariationChange, className }: SimpleVariationSelectorProps) {
  // Find first available color (with stock > 0)
  const firstAvailableColor = product.variations.colors.find(color => {
    return product.variations.variants.some(v => v.color === color && v.stock > 0)
  }) || product.variations.colors[0] || ""
  
  // Find first available size for that color (with stock > 0)
  const firstAvailableSize = product.variations.sizes.find(size => {
    return product.variations.variants.some(v => 
      v.color === firstAvailableColor && v.size === size && v.stock > 0
    )
  }) || product.variations.sizes[0] || ""
  
  const [selectedColor, setSelectedColor] = useState<string>(firstAvailableColor)
  const [selectedSize, setSelectedSize] = useState<string>(firstAvailableSize)
  
  // Initialize with first available options
  useEffect(() => {
    // Notify parent of initial selections
    if (firstAvailableColor && firstAvailableSize) {
      console.log('SimpleVariationSelector initializing with:', firstAvailableColor, firstAvailableSize);
      onVariationChange(firstAvailableColor, firstAvailableSize)
    }
  }, [firstAvailableColor, firstAvailableSize, onVariationChange])
  
  // Effect to update size when color changes if current size is not available
  useEffect(() => {
    if (selectedColor) {
      // Check if the current selectedSize is available for the selected color
      const currentVariant = product.variations.variants.find(
        v => v.color === selectedColor && v.size === selectedSize && v.stock > 0
      )
      
      // If current size is not available or out of stock, select first available size
      if (!currentVariant) {
        const availableSize = product.variations.sizes.find(size => {
          const variant = product.variations.variants.find(
            v => v.color === selectedColor && v.size === size && v.stock > 0
          )
          return variant !== undefined
        })
        
        if (availableSize) {
          setSelectedSize(availableSize)
          onVariationChange(selectedColor, availableSize)
        }
      } else {
        // Even if the current size is available, notify parent of selection
        onVariationChange(selectedColor, selectedSize)
      }
    }
  }, [selectedColor, product.variations.variants, product.variations.sizes])
  
  // Update the parent component when selection changes
  const handleColorChange = (color: string) => {
    console.log('Color selected:', color)
    setSelectedColor(color)
    
    // Find first available size for this color
    const availableSize = product.variations.sizes.find(size => {
      const variant = product.variations.variants.find(
        v => v.color === color && v.size === size && v.stock > 0
      )
      return variant !== undefined
    })
    
    if (availableSize) {
      setSelectedSize(availableSize)
      console.log('Notifying parent of color + size change:', color, availableSize)
      onVariationChange(color, availableSize)
    }
  }
  
  const handleSizeChange = (size: string) => {
    console.log('Size selected:', size)
    setSelectedSize(size)
    if (selectedColor) {
      console.log('Notifying parent of size change:', selectedColor, size)
      onVariationChange(selectedColor, size)
    }
  }

  // Get available sizes for selected color (with stock > 0)
  const availableSizes = product.variations.sizes.filter(size => {
    const variant = product.variations.variants.find(
      v => v.color === selectedColor && v.size === size && v.stock > 0
    )
    return variant && variant.stock > 0
  })

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Color</label>
        <Select 
          value={selectedColor} 
          onValueChange={handleColorChange}
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
            {product.variations.colors.map((color) => {
              const colorInfo = getColorByName(color)
              // Calculate total stock for this color across all sizes
              const totalStock = product.variations.variants
                .filter(v => v.color === color)
                .reduce((sum, v) => sum + (v.stock || 0), 0)
                
              const isOutOfStock = totalStock <= 0
              
              // Always render color options, but disable if out of stock
              return (
                <SelectItem 
                  key={color} 
                  value={color} 
                  disabled={isOutOfStock}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: colorInfo.hex }}
                    />
                    <span>{color}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {isOutOfStock ? "Out of stock" : `${totalStock} in stock`}
                    </span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Size</label>
        <Select 
          value={selectedSize} 
          onValueChange={handleSizeChange}
          disabled={availableSizes.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {product.variations.sizes.map((size) => {
              // For the selected color, show available stock for this size
              const stockForSize = selectedColor ? 
                product.variations.variants
                  .find(v => v.color === selectedColor && v.size === size)?.stock || 0
                : 0
                
              const isOutOfStock = stockForSize <= 0
              
              // Always show size options but disable if out of stock for selected color
              return (
                <SelectItem 
                  key={size} 
                  value={size}
                  disabled={isOutOfStock}
                >
                  <div className="flex items-center gap-2">
                    <span>{size}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {isOutOfStock ? "Out of stock" : `${stockForSize} in stock`}
                    </span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}