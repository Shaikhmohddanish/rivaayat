"use client"

import { useEffect } from "react"
import { SessionProvider, useSession } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { useLocalCacheCleanup, deleteLocalCachePattern, LS_KEYS } from "@/lib/local-storage"

// Cleanup component to handle cache management based on auth state
function CacheManager({ children }: { children: React.ReactNode }) {
  // Initialize cache cleanup on mount
  useLocalCacheCleanup();
  
  // Get session to track authentication state
  const { status } = useSession();
  
  // Clear user data when session becomes unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Clear all user-related cache when logged out
      deleteLocalCachePattern('user:*');
    }
  }, [status]);
  
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <CacheManager>
          {children}
        </CacheManager>
      </SessionProvider>
    </ThemeProvider>
  )
}