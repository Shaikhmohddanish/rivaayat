import { NextResponse } from 'next/server'
import { initializeProductCache } from '@/lib/cache-init'

export async function POST() {
  try {
    await initializeProductCache()
    
    return NextResponse.json({
      success: true,
      message: 'Product cache initialized successfully'
    })
  } catch (error) {
    console.error('Cache initialization error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize cache'
    }, { status: 500 })
  }
}