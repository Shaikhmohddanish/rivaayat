"use client"

import { useState, useEffect } from 'react'
import { generateSlug, makeSlugUnique } from '@/lib/slug-utils'

type SlugStatus = 'checking' | 'available' | 'unavailable' | 'error' | 'idle'

interface UseSlugResult {
  slug: string
  setName: (name: string) => void
  setSlug: (slug: string) => void
  status: SlugStatus
  message: string
  isValid: boolean
  checkSlug: () => Promise<boolean>
}

interface UseSlugOptions {
  productId?: string; // Optional product ID for edit mode
}

/**
 * React hook for handling product slug generation and validation
 * 
 * @param initialName - Initial product name
 * @param options - Additional options like productId for edit mode
 * @returns Slug state and utility functions
 */
export function useSlug(initialName: string = '', options: UseSlugOptions = {}): UseSlugResult {
  const [name, setName] = useState<string>(initialName)
  const [slug, setSlugInternal] = useState<string>(initialName ? generateSlug(initialName) : '')
  const [status, setStatus] = useState<SlugStatus>('idle')
  const [message, setMessage] = useState<string>('')
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isValid, setIsValid] = useState<boolean>(false)
  const { productId } = options

  // Generate a slug whenever the name changes
  useEffect(() => {
    if (name) {
      const newSlug = generateSlug(name)
      setSlugInternal(newSlug)
      
      // Debounce the API check to avoid too many requests
      if (debounceTimeout) clearTimeout(debounceTimeout)
      
      const timeout = setTimeout(() => {
        checkSlugAvailability(newSlug)
      }, 500)
      
      setDebounceTimeout(timeout)
    }
    
    // Cleanup
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
    }
  }, [name])

  // Check if a slug is available via API
  async function checkSlugAvailability(slugToCheck: string) {
    if (!slugToCheck) {
      setStatus('idle')
      setMessage('')
      setIsValid(false)
      return false
    }

    setStatus('checking')
    setMessage('Checking availability...')
    
    try {
      // Build URL with optional productId parameter for edit mode
      let url = `/api/admin/check-slug?slug=${encodeURIComponent(slugToCheck)}`;
      if (productId) {
        url += `&productId=${encodeURIComponent(productId)}`;
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to check slug')
      }
      
      const data = await response.json()
      
      if (data.available) {
        setStatus('available')
        setMessage('This slug is available.')
        setIsValid(true)
        return true
      } else {
        setStatus('unavailable')
        setMessage(`This slug is already in use. Consider using: ${data.suggestedSlug}`)
        setIsValid(false)
        return false
      }
    } catch (error) {
      console.error('Error checking slug:', error)
      setStatus('error')
      setMessage('Error checking slug availability')
      setIsValid(false)
      return false
    }
  }

  // Set a custom slug manually
  const setSlug = (newSlug: string) => {
    const formattedSlug = newSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    setSlugInternal(formattedSlug)
    
    if (debounceTimeout) clearTimeout(debounceTimeout)
    
    const timeout = setTimeout(() => {
      checkSlugAvailability(formattedSlug)
    }, 500)
    
    setDebounceTimeout(timeout)
  }

  // Public method to check the current slug
  const checkSlug = async () => {
    return await checkSlugAvailability(slug)
  }

  return {
    slug,
    setName,
    setSlug,
    status,
    message,
    isValid,
    checkSlug
  }
}