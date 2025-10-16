/**
 * 🚀 OPTIMIZATION Item 13: User Profile Caching
 * 
 * Provides sessionStorage caching for user profile data to reduce API calls.
 * Uses sessionStorage for session-specific caching.
 */

import type { User } from "./types"

const USER_PROFILE_CACHE_KEY = "rivaayat_user_profile_cache"
const USER_PROFILE_TIMESTAMP_KEY = "rivaayat_user_profile_timestamp"
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

interface UserProfileCache {
  profile: User
  timestamp: number
}

/**
 * Check if user profile cache is still valid
 */
export function isUserProfileCacheValid(): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const timestamp = sessionStorage.getItem(USER_PROFILE_TIMESTAMP_KEY)
    if (!timestamp) return false
    
    const age = Date.now() - parseInt(timestamp, 10)
    return age < CACHE_DURATION
  } catch (error) {
    console.debug("Error checking user profile cache validity:", error)
    return false
  }
}

/**
 * Get cached user profile
 */
export function getCachedUserProfile(): User | null {
  if (typeof window === "undefined") return null
  
  try {
    if (!isUserProfileCacheValid()) {
      clearUserProfileCache()
      return null
    }
    
    const cached = sessionStorage.getItem(USER_PROFILE_CACHE_KEY)
    if (!cached) return null
    
    const cache: UserProfileCache = JSON.parse(cached)
    return cache.profile
  } catch (error) {
    console.debug("Error reading user profile cache:", error)
    clearUserProfileCache()
    return null
  }
}

/**
 * Set user profile cache
 */
export function setCachedUserProfile(profile: User): void {
  if (typeof window === "undefined") return
  
  try {
    const cache: UserProfileCache = {
      profile,
      timestamp: Date.now()
    }
    
    sessionStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(cache))
    sessionStorage.setItem(USER_PROFILE_TIMESTAMP_KEY, Date.now().toString())
    
    console.log(`User profile cached for: ${profile.email}`)
  } catch (error) {
    console.debug("Error setting user profile cache:", error)
  }
}

/**
 * Clear user profile cache
 */
export function clearUserProfileCache(): void {
  if (typeof window === "undefined") return
  
  try {
    sessionStorage.removeItem(USER_PROFILE_CACHE_KEY)
    sessionStorage.removeItem(USER_PROFILE_TIMESTAMP_KEY)
    console.log("User profile cache cleared")
  } catch (error) {
    console.debug("Error clearing user profile cache:", error)
  }
}

/**
 * Update user profile cache
 */
export function updateUserProfileCache(profile: User): void {
  setCachedUserProfile(profile)
  
  // Dispatch event for other components to listen to
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("userProfileCacheUpdated", { 
      detail: { profile } 
    }))
  }
}
