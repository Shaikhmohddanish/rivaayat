"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ShimmerProductCard } from "@/components/ui/shimmer"
import { Search, X } from "lucide-react"
import type { Product } from "@/lib/types"
import { ProductCard } from "@/components/product-card"
import { QuickViewModal } from "@/components/quick-view-modal"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { getCachedWishlist, updateWishlistCache } from "@/lib/wishlist-cache"
import { setCachedProductList } from "@/lib/product-list-cache"
import { cacheProducts, isIndexedDBSupported } from "@/lib/product-cache"

interface ShopPageClientProps {
  products: (Product & { _id: string })[]
  availableColors: string[]
  availableSizes: string[]
  isLoading?: boolean
}

const ITEMS_PER_PAGE = 12

export function ShopPageClient({ products, availableColors, availableSizes, isLoading = false }: ShopPageClientProps) {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [quickViewProduct, setQuickViewProduct] = useState<(Product & { _id: string }) | null>(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([])

  // 🚀 OPTIMIZATION Item 12: Cache product list in sessionStorage and IndexedDB
  useEffect(() => {
    if (products.length > 0) {
      // SessionStorage for quick access (synchronous)
      setCachedProductList(products)
      
      // IndexedDB for persistent storage across sessions
      if (isIndexedDBSupported()) {
        cacheProducts(products).catch(err => {
          console.debug('Failed to cache products in IndexedDB:', err)
        })
      }
    }
  }, [products])

  // 🚀 OPTIMIZATION Item 7 & 11: Fetch wishlist once with cache support
  useEffect(() => {
    const fetchWishlist = async () => {
      if (status !== "authenticated" || !session) {
        setWishlistProductIds([])
        return
      }
      
      // Try cache first for instant display
      const cached = getCachedWishlist()
      if (cached) {
        setWishlistProductIds(cached.productIds)
        console.log("Wishlist loaded from cache:", cached.productIds.length, "items")
      }
      
      try {
        // Fetch fresh data in background
        const res = await fetch("/api/wishlist", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const freshIds = data.productIds || []
        setWishlistProductIds(freshIds)
        
        // Update cache
        updateWishlistCache(freshIds)
        console.log("Wishlist updated from API:", freshIds.length, "items")
      } catch (error) {
        console.debug("Failed to fetch wishlist:", error)
      }
    }

    fetchWishlist()
  }, [session, status])

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Color filter
      if (selectedColors.length > 0) {
        const productColors = product.variations?.variants?.map((v) => v.color) || []
        const hasMatchingColor = selectedColors.some((color) => productColors.includes(color))
        if (!hasMatchingColor) return false
      }

      // Size filter
      if (selectedSizes.length > 0) {
        const productSizes = product.variations?.variants?.map((v) => v.size) || []
        const hasMatchingSize = selectedSizes.some((size) => productSizes.includes(size))
        if (!hasMatchingSize) return false
      }

      return true
    })
  }, [products, searchQuery, selectedColors, selectedSizes])

  const displayedProducts = filteredProducts.slice(0, displayCount)
  const hasMore = displayCount < filteredProducts.length

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]))
    setDisplayCount(ITEMS_PER_PAGE) // Reset pagination when filter changes
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]))
    setDisplayCount(ITEMS_PER_PAGE) // Reset pagination when filter changes
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedColors([])
    setSelectedSizes([])
    setDisplayCount(ITEMS_PER_PAGE)
  }

  const hasActiveFilters = searchQuery || selectedColors.length > 0 || selectedSizes.length > 0

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Color Filter */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Colors</h3>
          <div className="space-y-2">
            {availableColors.map((color) => (
              <div key={color} className="flex items-center space-x-2">
                <Checkbox
                  id={`color-${color}`}
                  checked={selectedColors.includes(color)}
                  onCheckedChange={() => toggleColor(color)}
                />
                <Label htmlFor={`color-${color}`} className="cursor-pointer">
                  {color}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Size Filter */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Sizes</h3>
          <div className="space-y-2">
            {availableSizes.map((size) => (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  id={`size-${size}`}
                  checked={selectedSizes.includes(size)}
                  onCheckedChange={() => toggleSize(size)}
                />
                <Label htmlFor={`size-${size}`} className="cursor-pointer">
                  {size}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Shop</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Filters</h2>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Mobile Filter */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setDisplayCount(ITEMS_PER_PAGE)
                }}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline">
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {selectedColors.length + selectedSizes.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Filter products by color and size</SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                  {hasActiveFilters && (
                    <Button variant="outline" className="w-full mt-6 bg-transparent" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedColors.map((color) => (
                <Button key={color} variant="secondary" size="sm" onClick={() => toggleColor(color)}>
                  {color}
                  <X className="ml-2 h-3 w-3" />
                </Button>
              ))}
              {selectedSizes.map((size) => (
                <Button key={size} variant="secondary" size="sm" onClick={() => toggleSize(size)}>
                  {size}
                  <X className="ml-2 h-3 w-3" />
                </Button>
              ))}
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {displayedProducts.length} of {filteredProducts.length} products
          </p>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <ShimmerProductCard key={i} />
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <ProductCard 
                    key={product._id} 
                    product={product} 
                    onQuickView={setQuickViewProduct}
                    wishlistProductIds={wishlistProductIds}
                    onWishlistChange={setWishlistProductIds}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_PAGE)} size="lg">
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">No products found</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <QuickViewModal product={quickViewProduct} open={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  )
}
