import { NextRequest, NextResponse } from 'next/server'
import { SearchService } from '@/lib/search-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim() || query.length < 2) {
      return NextResponse.json({
        suggestions: []
      })
    }

    const suggestions = await SearchService.getAutocompleteSuggestions(query.trim())
    
    return NextResponse.json({
      suggestions
    })
  } catch (error) {
    console.error('Autocomplete API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}