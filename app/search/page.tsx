"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { ProductCard } from "@/components/product-card"
import { QuickViewModal } from "@/components/quick-view-modal"
import { 
  Search, 
  Filter, 
  X, 
  Loader2, 
  SlidersHorizontal,
  Grid3X3,
  List
} from "lucide-react"
import type { Product } from "@/lib/types"
import { SearchResult } from "@/lib/search-service"
import { formatPriceRange } from "@/lib/utils"

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
]

const CATEGORIES = [
  'Ethnic Wear',
  'Western Wear', 
  'Dresses',
  'Kurtis',
  'Sarees',
  'Lehengas',
  'Tops & Tunics',
  'Bottoms',
  'Accessories',
  'Footwear'
]

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || '')
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '10000')
  ])
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  // Quick view
  const [quickViewProduct, setQuickViewProduct] = useState<(Product & { _id: string }) | null>(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults(null)
        return
      }
      
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          ...(selectedCategory && selectedCategory !== 'all' && { category: selectedCategory }),
          ...(selectedSubcategory && { subcategory: selectedSubcategory }),
          minPrice: priceRange[0].toString(),
          maxPrice: priceRange[1].toString(),
          sortBy,
          limit: itemsPerPage.toString(),
          offset: ((currentPage - 1) * itemsPerPage).toString()
        })

        const response = await fetch(`/api/search?${params}`)
        if (response.ok) {
          const results = await response.json()
          setSearchResults(results)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    [selectedCategory, selectedSubcategory, priceRange, sortBy, currentPage]
  )

  // Autocomplete suggestions
  const debouncedAutocomplete = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }
      
      try {
        const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const { suggestions } = await response.json()
          setSuggestions(suggestions)
        }
      } catch (error) {
        console.error('Autocomplete error:', error)
      }
    }, 200),
    []
  )

  // Effects
  useEffect(() => {
    const query = searchParams.get('q') || ''
    if (query !== searchQuery) {
      setSearchQuery(query)
    }
  }, [searchParams])

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery)
      debouncedAutocomplete(searchQuery)
    }
  }, [searchQuery, debouncedSearch, debouncedAutocomplete])

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, selectedCategory, selectedSubcategory, priceRange, sortBy, currentPage, debouncedSearch])

  // Handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const params = new URLSearchParams({ q: searchQuery.trim() })
      router.push(`/search?${params}`)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    const params = new URLSearchParams({ q: suggestion })
    router.push(`/search?${params}`)
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedSubcategory('')
    setPriceRange([0, 10000])
    setSortBy('relevance')
    setCurrentPage(1)
  }

  const hasActiveFilters = selectedCategory !== 'all' || selectedSubcategory || priceRange[0] > 0 || priceRange[1] < 10000

  const totalPages = Math.ceil((searchResults?.total || 0) / itemsPerPage)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Search Products</h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for sarees, kurtis, lehengas, dresses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-12 h-12 text-lg"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto">
              <CardContent className="p-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm"
                  >
                    <Search className="inline h-3 w-3 mr-2 text-muted-foreground" />
                    {suggestion}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </form>

        {/* Search Info */}
        {searchResults && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              {searchResults.total > 0 ? (
                <>
                  Showing {searchResults.products.length} of {searchResults.total} results 
                  {searchQuery && ` for "${searchQuery}"`}
                </>
              ) : (
                `No results found${searchQuery ? ` for "${searchQuery}"` : ''}`
              )}
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={`w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Sort */}
              <div className="space-y-3 mb-6">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-3 mb-6">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label>
                  Price Range: {formatPriceRange(priceRange[0], priceRange[1])}
                </Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Results */}
        <main className="flex-1">
          {loading && !searchResults && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {searchResults && (
            <>
              {searchResults.products.length > 0 ? (
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                }>
                  {searchResults.products.map((product) => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      onQuickView={setQuickViewProduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
                    No products found matching your search.
                  </p>
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <QuickViewModal 
        product={quickViewProduct} 
        open={!!quickViewProduct} 
        onClose={() => setQuickViewProduct(null)} 
      />
    </div>
  )
}