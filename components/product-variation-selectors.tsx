"use client"

import * as React from 'react'
import { Check, PlusCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { STANDARD_COLORS, STANDARD_SIZES } from "@/lib/product-options"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ColorOption {
  value: string
  label: string
  hex?: string
}

interface ColorSelectorProps {
  selectedColors: string[]
  onChange: (colors: string[]) => void
  className?: string
}

export function ColorSelector({ selectedColors, onChange, className }: ColorSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [customColor, setCustomColor] = React.useState("")

  const handleSelect = (color: string) => {
    if (selectedColors.includes(color)) {
      onChange(selectedColors.filter(c => c !== color))
    } else {
      onChange([...selectedColors, color])
    }
  }

  const handleAddCustom = () => {
    if (customColor && !selectedColors.includes(customColor)) {
      onChange([...selectedColors, customColor])
      setCustomColor("")
    }
  }

  const handleRemove = (color: string) => {
    onChange(selectedColors.filter(c => c !== color))
  }

  // Find color objects (including hex) for selected colors
  const selectedColorObjects: ColorOption[] = selectedColors.map(color => 
    STANDARD_COLORS.find(c => c.value === color) || { value: color, label: color }
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {selectedColorObjects.filter(color => color.value.trim() !== "").map((color) => (
          <Badge 
            key={color.value} 
            variant="outline"
            className="pl-2 flex items-center gap-1 text-sm"
          >
            {color.hex && (
              <span 
                className="w-3 h-3 rounded-full inline-block mr-1" 
                style={{ backgroundColor: color.hex }}
              />
            )}
            {color.label}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 ml-1 rounded-full" 
              onClick={() => handleRemove(color.value)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              Select colors
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search color..." />
              <CommandEmpty>No color found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {STANDARD_COLORS.map((color) => (
                  <CommandItem
                    key={color.value}
                    value={color.value}
                    onSelect={() => {
                      handleSelect(color.value)
                    }}
                    className="flex items-center gap-2"
                  >
                    <span 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.label}</span>
                    {selectedColors.includes(color.value) && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add custom color..."
        />
        <Button 
          type="button" 
          size="sm" 
          variant="ghost" 
          onClick={handleAddCustom} 
          disabled={!customColor}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}

interface SizeSelectorProps {
  selectedSizes: string[]
  onChange: (sizes: string[]) => void
  className?: string
}

export function SizeSelector({ selectedSizes, onChange, className }: SizeSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [customSize, setCustomSize] = React.useState("")

  const handleSelect = (size: string) => {
    if (selectedSizes.includes(size)) {
      onChange(selectedSizes.filter(s => s !== size))
    } else {
      onChange([...selectedSizes, size])
    }
  }

  const handleAddCustom = () => {
    if (customSize && !selectedSizes.includes(customSize)) {
      onChange([...selectedSizes, customSize])
      setCustomSize("")
    }
  }

  const handleRemove = (size: string) => {
    onChange(selectedSizes.filter(s => s !== size))
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {selectedSizes.filter(size => size.trim() !== "").map((size) => (
          <Badge 
            key={size} 
            variant="outline"
            className="pl-2 flex items-center gap-1 text-sm"
          >
            {size}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 ml-1 rounded-full" 
              onClick={() => handleRemove(size)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              Select sizes
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search size..." />
              <CommandEmpty>No size found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {STANDARD_SIZES.map((size) => (
                  <CommandItem
                    key={size.value}
                    value={size.value}
                    onSelect={() => {
                      handleSelect(size.value)
                      setOpen(false)
                    }}
                  >
                    {size.label}
                    {selectedSizes.includes(size.value) && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={customSize}
          onChange={(e) => setCustomSize(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add custom size..."
        />
        <Button 
          type="button" 
          size="sm" 
          variant="ghost" 
          onClick={handleAddCustom} 
          disabled={!customSize}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}