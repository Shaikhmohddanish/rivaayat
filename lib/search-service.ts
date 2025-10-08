import { getDatabase, isMongoDBAvailable } from "@/lib/mongodb-safe"
import { productDb as mockProductDb } from "@/lib/db"
import type { Product } from "@/lib/types"

// Extended Product interface for search functionality
export interface SearchableProduct extends Product {
  category?: string
  subcategory?: string
  brand?: string
  tags?: string[]
  rating?: number
}

export interface SearchOptions {
  query: string
  category?: string
  subcategory?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating'
  limit?: number
  offset?: number
}

export interface SearchResult {
  products: (SearchableProduct & { _id: string })[]
  total: number
  hasMore: boolean
  suggestions?: string[]
}

/**
 * Advanced Search Service that uses MongoDB or mock data
 */
export class SearchService {
  private static readonly SEARCH_CACHE_TTL = 3600 // 1 hour
  
  // In-memory cache for suggestions
  private static suggestionCache = new Map<string, { data: string[], expires: number }>();

  /**
   * Main search function that searches in MongoDB or mock data
   */
  static async searchProducts(options: SearchOptions): Promise<SearchResult> {
    const { query, limit = 20, offset = 0 } = options

    try {
      console.log(`Searching for query: "${query}"`);

      // Search directly in database
      const searchResults = await this.searchInDatabase(options)

      // Apply additional filters and sorting
      const filteredResults = this.applyFiltersAndSort(searchResults, options)

      return this.formatSearchResults(filteredResults, options)
    } catch (error) {
      console.error('Search error:', error)
      return {
        products: [],
        total: 0,
        hasMore: false,
        suggestions: []
      }
    }
  }

  /**
   * Search in database (MongoDB or fallback to mock data)
   */
  private static async searchInDatabase(options: SearchOptions): Promise<(SearchableProduct & { _id: string })[]> {
    try {
      if (isMongoDBAvailable()) {
        return await this.searchInMongoDB(options)
      } else {
        return await this.searchInMockData(options)
      }
    } catch (error) {
      console.warn('Database search failed, falling back to mock data:', error)
      return await this.searchInMockData(options)
    }
  }

  /**
   * Search in MongoDB with full-text search capabilities
   */
  private static async searchInMongoDB(options: SearchOptions): Promise<(SearchableProduct & { _id: string })[]> {
    const db = await getDatabase()
    if (!db) throw new Error('MongoDB not available')

    const { query, category, subcategory, minPrice, maxPrice } = options

    // Build MongoDB query
    const searchQuery: any = {}

    // Text search
    if (query.trim()) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { subcategory: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        { brand: { $regex: query, $options: 'i' } }
      ]
    }

    // Category filter
    if (category) {
      searchQuery.category = { $regex: category, $options: 'i' }
    }

    // Subcategory filter
    if (subcategory) {
      searchQuery.subcategory = { $regex: subcategory, $options: 'i' }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      searchQuery.price = {}
      if (minPrice !== undefined) searchQuery.price.$gte = minPrice
      if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice
    }

    // Execute search
    let cursor = db.collection<SearchableProduct>("products").find(searchQuery)

    // Apply sorting
    switch (options.sortBy) {
      case 'price_asc':
        cursor = cursor.sort({ price: 1 })
        break
      case 'price_desc':
        cursor = cursor.sort({ price: -1 })
        break
      case 'newest':
        cursor = cursor.sort({ createdAt: -1 })
        break
      case 'rating':
        cursor = cursor.sort({ rating: -1 })
        break
      default: // relevance
        // MongoDB's default relevance scoring
        break
    }

    const products = await cursor.toArray()

    return products.map((p) => ({
      ...p,
      _id: p._id?.toString() || '',
    }))
  }

  /**
   * Search in mock data as fallback
   */
  private static async searchInMockData(options: SearchOptions): Promise<(SearchableProduct & { _id: string })[]> {
    const { query } = options
    const products = await mockProductDb.find({}) as (SearchableProduct & { _id: string })[]

    if (!query.trim()) return products

    const searchQuery = query.toLowerCase()
    
    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.subcategory,
        product.tags?.join(' '),
        product.brand
      ].filter(Boolean).join(' ').toLowerCase()

      return searchableText.includes(searchQuery) ||
             searchQuery.split(' ').some(term => searchableText.includes(term))
    })
  }

  /**
   * Apply additional filters and sorting to search results
   */
  private static applyFiltersAndSort(
    products: (SearchableProduct & { _id: string })[], 
    options: SearchOptions
  ): (SearchableProduct & { _id: string })[] {
    let filtered = [...products]

    // Apply category filter
    if (options.category) {
      filtered = filtered.filter(p => 
        p.category && p.category.toLowerCase().includes(options.category!.toLowerCase())
      )
    }

    // Apply subcategory filter
    if (options.subcategory) {
      filtered = filtered.filter(p => 
        p.subcategory && p.subcategory.toLowerCase().includes(options.subcategory!.toLowerCase())
      )
    }

    // Apply price range filter
    if (options.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= options.minPrice!)
    }
    if (options.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= options.maxPrice!)
    }

    // Apply sorting
    switch (options.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        filtered.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      default: // relevance - keep original order
        break
    }

    return filtered
  }

  /**
   * Format search results with pagination
   */
  private static formatSearchResults(
    products: (SearchableProduct & { _id: string })[], 
    options: SearchOptions
  ): SearchResult {
    const { limit = 20, offset = 0 } = options
    const total = products.length
    const paginatedProducts = products.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return {
      products: paginatedProducts,
      total,
      hasMore,
      suggestions: this.generateSuggestions(options.query, products)
    }
  }

  /**
   * Generate search suggestions based on available products
   */
  private static generateSuggestions(query: string, products: (SearchableProduct & { _id: string })[]): string[] {
    if (!query.trim()) return []

    const suggestions = new Set<string>()
    const queryLower = query.toLowerCase()

    products.forEach(product => {
      // Add product names that partially match
      if (product.name.toLowerCase().includes(queryLower)) {
        suggestions.add(product.name)
      }
      
      // Add categories that match
      if (product.category && product.category.toLowerCase().includes(queryLower)) {
        suggestions.add(product.category)
      }
      
      // Add brands that match
      if (product.brand && product.brand.toLowerCase().includes(queryLower)) {
        suggestions.add(product.brand)
      }
    })

    return Array.from(suggestions).slice(0, 5) // Limit to 5 suggestions
  }

  /**
   * Get popular search terms (cached in memory)
   */
  static async getPopularSearches(): Promise<string[]> {
    try {
      const cacheKey = 'popular_searches';
      const cached = this.suggestionCache.get(cacheKey);
      
      if (cached && Date.now() < cached.expires) {
        return cached.data;
      }

      // If not cached, return some default popular searches
      const popular = [
        'saree', 'kurti', 'lehenga', 'ethnic wear', 'dress', 
        'traditional wear', 'indian wear', 'western wear', 'palazzo', 'churidar'
      ]
      
      // Cache for 24 hours
      this.suggestionCache.set(cacheKey, { 
        data: popular, 
        expires: Date.now() + (24 * 60 * 60 * 1000) 
      });
      
      return popular;
    } catch (error) {
      console.error('Error getting popular searches:', error)
      return []
    }
  }

  /**
   * Get search autocomplete suggestions
   */
  static async getAutocompleteSuggestions(query: string): Promise<string[]> {
    if (!query.trim() || query.length < 2) return []

    try {
      // Search in database for suggestions
      const searchOptions = {
        query: query.trim(),
        limit: 50,
        sortBy: 'relevance' as const
      };
      
      const searchResults = await this.searchInDatabase(searchOptions);
      return this.generateSuggestions(query, searchResults.slice(0, 50));
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error)
      return []
    }
  }
}