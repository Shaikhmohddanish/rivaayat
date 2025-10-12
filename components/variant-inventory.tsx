"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { getColorByName } from '@/lib/product-options'
import type { ProductVariant } from '@/lib/types'

interface VariantInventoryProps {
  colors: string[]
  sizes: string[]
  variants: ProductVariant[]
  onChange: (variants: ProductVariant[]) => void
}

export function VariantInventory({ colors, sizes, variants, onChange }: VariantInventoryProps) {
  // Create a map for easy access to current stock values
  const [stockMap, setStockMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    variants.forEach(v => {
      map[`${v.color}-${v.size}`] = v.stock || 0;
    });
    return map;
  });

  // Handle stock change for a specific variant
  const handleStockChange = (color: string, size: string, value: string) => {
    const key = `${color}-${size}`;
    const newStock = parseInt(value) || 0;
    
    setStockMap(prev => ({
      ...prev,
      [key]: newStock
    }));
    
    // Update the full variants array
    const updatedVariants: ProductVariant[] = [];
    colors.forEach(c => {
      sizes.forEach(s => {
        const variantKey = `${c}-${s}`;
        const stockValue = (c === color && s === size) ? newStock : (stockMap[variantKey] || 0);
        updatedVariants.push({
          color: c,
          size: s,
          stock: stockValue
        });
      });
    });
    
    onChange(updatedVariants);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Variant</TableHead>
            {sizes.map(size => (
              <TableHead key={size}>{size}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {colors.map(color => {
            const colorInfo = getColorByName(color);
            return (
              <TableRow key={color}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: colorInfo.hex }}
                    ></span>
                    <span>{color}</span>
                  </div>
                </TableCell>
                {sizes.map(size => {
                  const key = `${color}-${size}`;
                  const currentStock = stockMap[key] || 0;
                  
                  return (
                    <TableCell key={size}>
                      <Input
                        type="number"
                        min="0"
                        value={currentStock}
                        onChange={(e) => handleStockChange(color, size, e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}