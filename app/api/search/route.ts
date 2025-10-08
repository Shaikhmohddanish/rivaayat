import { NextRequest, NextResponse } from 'next/server'
import { SearchService } from '@/lib/search-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || undefined
    const subcategory = searchParams.get('subcategory') || undefined
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const sortBy = searchParams.get('sortBy') as 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating' || 'relevance'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query.trim()) {
      return NextResponse.json({
        error: 'Search query is required'
      }, { status: 400 })
    }

    const searchOptions = {
      query: query.trim(),
      category,
      subcategory,
      minPrice,
      maxPrice,
      sortBy,
      limit,
      offset
    }

    const results = await SearchService.searchProducts(searchOptions)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}