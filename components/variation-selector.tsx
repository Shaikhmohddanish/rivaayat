"use client"

import { useState, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils'
import { getColorByName } from '@/lib/product-options'
import type { ProductVariant } from '@/lib/types'

interface VariationSelectorProps {
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

export function VariationSelector({ product, onVariationChange, className }: VariationSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.variations.colors[0] || null
  )
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.variations.sizes[0] || null
  )
  
  const [colorOpen, setColorOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)
  
  // Effect to update size when color changes if current size is not available
  useEffect(() => {
    if (selectedColor) {
      // Check if the current selectedSize is available for the selected color
      const currentVariant = product.variations.variants.find(
        v => v.color === selectedColor && v.size === selectedSize
      )
      
      // If current size is not available or out of stock, select first available size
      if (!currentVariant || currentVariant.stock <= 0) {
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
      }
    }
  }, [selectedColor, selectedSize, product.variations.variants, product.variations.sizes, onVariationChange])
  
  // Update the parent component when selection changes
  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    if (selectedSize) {
      onVariationChange(color, selectedSize)
    }
  }
  
  const handleSizeChange = (size: string) => {
    setSelectedSize(size)
    if (selectedColor) {
      onVariationChange(selectedColor, size)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Color</label>
        <Popover open={colorOpen} onOpenChange={setColorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={colorOpen}
              className="w-full justify-between"
            >
              {selectedColor ? (
                <div className="flex items-center gap-2">
                  <span 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: getColorByName(selectedColor).hex }}
                  />
                  <span>{selectedColor}</span>
                </div>
              ) : (
                "Select color"
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search color..." />
              <CommandEmpty>No color found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {product.variations.colors.map((color) => {
                  const colorInfo = getColorByName(color)
                  // Calculate total stock for this color across all sizes
                  const totalStock = product.variations.variants
                    .filter(v => v.color === color)
                    .reduce((sum, v) => sum + (v.stock || 0), 0);
                    
                  const isOutOfStock = totalStock <= 0;
                  
                  return (
                    <CommandItem
                      key={color}
                      value={color}
                      onSelect={() => {
                        handleColorChange(color)
                        setColorOpen(false)
                      }}
                      className={`flex items-center gap-2 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isOutOfStock}
                    >
                      <span 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: colorInfo.hex }}
                      />
                      <span>{color}</span>
                      <span className="ml-auto text-xs text-muted-foreground mr-2">
                        {totalStock} in stock
                      </span>
                      {selectedColor === color && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Size</label>
        <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={sizeOpen}
              className="w-full justify-between"
            >
              {selectedSize || "Select size"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search size..." />
              <CommandEmpty>No size found.</CommandEmpty>
              <CommandGroup>
                {product.variations.sizes.map((size) => {
                  // For the selected color, show available stock for this size
                  const stockForSize = selectedColor ? 
                    product.variations.variants
                      .find(v => v.color === selectedColor && v.size === size)?.stock || 0
                    : 0;
                    
                  const isOutOfStock = stockForSize <= 0;
                  
                  return (
                    <CommandItem
                      key={size}
                      value={size}
                      onSelect={() => {
                        handleSizeChange(size)
                        setSizeOpen(false)
                      }}
                      className={isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}
                      disabled={isOutOfStock}
                    >
                      {size}
                      <span className="ml-auto text-xs text-muted-foreground mr-2">
                        {stockForSize} in stock
                      </span>
                      {selectedSize === size && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}