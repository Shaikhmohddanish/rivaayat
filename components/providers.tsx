"use client"

import { useEffect } from "react"
import { SessionProvider, useSession, signOut } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { CartWishlistProvider } from "@/components/cart-wishlist-provider"
import { useLocalCacheCleanup, deleteLocalCachePattern } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

// Cleanup component to handle cache management based on auth state
function CacheManager({ children }: { children: React.ReactNode }) {
  // Initialize cache cleanup on mount
  useLocalCacheCleanup();
  
  // Get session to track authentication state
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  // Handle disabled accounts
  useEffect(() => {
    if (session?.user?.disabled) {
      // Show toast message
      toast({
        title: "Account Disabled",
        description: "Your account has been disabled by an administrator. Please contact support for assistance.",
        variant: "destructive",
        duration: 6000,
      });
      
      // Sign out the user
      signOut({ callbackUrl: "/auth/error?error=AccountDisabled" });
    }
  }, [session, toast]);
  
  // Clear user data when session becomes unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Clear all user-related cache when logged out
      console.log("User logged out - clearing localStorage data");
      deleteLocalCachePattern('user:*');
      
      // Also clear any potential session-related items that might be stored
      deleteLocalCachePattern('session:*');
      deleteLocalCachePattern('auth:*');
      
      // For debugging - log localStorage keys that remain after cleanup
      console.log("Remaining localStorage items after logout cleanup:", 
        Object.keys(localStorage).filter(key => 
          key.startsWith('user:') || key.startsWith('session:') || key.startsWith('auth:')
        )
      );
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
      <SessionProvider 
        refetchInterval={5 * 60} 
        refetchOnWindowFocus={false}
      >
        <CacheManager>
          <CartWishlistProvider>
            {children}
          </CartWishlistProvider>
        </CacheManager>
      </SessionProvider>
    </ThemeProvider>
  )
}