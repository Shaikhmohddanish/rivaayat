import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getLocalCache, setLocalCache, deleteLocalCache, LS_KEYS } from '@/lib/local-storage';

interface UserSessionData {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

/**
 * Custom hook that provides reactive user session data
 * Syncs with localStorage for instant updates across components
 */
export function useUserSession() {
  const { data: session, status, update } = useSession();
  const [userData, setUserData] = useState<UserSessionData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync user data when session changes
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'authenticated' && session?.user) {
      // Get cached user data
      const cachedData = getLocalCache<UserSessionData>(LS_KEYS.USER_SESSION);
      
      // Merge session with cached data (cached data takes precedence for updates)
      const merged: UserSessionData = {
        name: cachedData?.name || session.user.name,
        email: cachedData?.email || session.user.email,
        image: cachedData?.image || session.user.image,
        role: (session.user as any).role || cachedData?.role,
      };

      // Only update if data actually changed
      setUserData(prev => {
        if (!prev || 
            prev.name !== merged.name || 
            prev.email !== merged.email || 
            prev.image !== merged.image ||
            prev.role !== merged.role) {
          return merged;
        }
        return prev;
      });

      // Update localStorage only once on initialization or if data changed
      if (!isInitialized || !cachedData || 
          cachedData.name !== merged.name || 
          cachedData.email !== merged.email || 
          cachedData.image !== merged.image) {
        setLocalCache(LS_KEYS.USER_SESSION, merged, 24 * 60 * 60 * 1000);
        setIsInitialized(true);
      }
    } else if (status === 'unauthenticated') {
      setUserData(null);
      setIsInitialized(false);
      deleteLocalCache(LS_KEYS.USER_SESSION);
    }
  }, [session?.user?.name, session?.user?.email, session?.user?.image, status, isInitialized]);

  // Listen for localStorage changes (profile updates)
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      if (customEvent.detail?.key === LS_KEYS.USER_SESSION) {
        // Re-read from localStorage
        const cached = getLocalCache<UserSessionData>(LS_KEYS.USER_SESSION);
        if (cached) {
          setUserData(cached);
        }
      }
    };

    // Listen for custom storage events (same tab)
    window.addEventListener('localStorageChange', handleStorageChange);

    // Listen for storage events (cross tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LS_KEYS.USER_SESSION) {
        const cached = getLocalCache<UserSessionData>(LS_KEYS.USER_SESSION);
        if (cached) {
          setUserData(cached);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return {
    userData,
    status,
    session,
    update,
  };
}

/**
 * Update user session data in localStorage and trigger reactivity
 * Call this after profile updates
 */
export function updateUserSessionData(data: Partial<UserSessionData>): void {
  if (typeof window === 'undefined') return;

  const cached = getLocalCache<UserSessionData>(LS_KEYS.USER_SESSION) || {};
  const updated = { ...cached, ...data };
  
  setLocalCache(LS_KEYS.USER_SESSION, updated, 24 * 60 * 60 * 1000);
  
  // Trigger event for same-tab updates
  window.dispatchEvent(new CustomEvent('localStorageChange', { 
    detail: { key: LS_KEYS.USER_SESSION } 
  }));
}

/**
 * Clear user session data from localStorage
 * Call this on logout
 */
export function clearUserSessionData(): void {
  if (typeof window === 'undefined') return;
  deleteLocalCache(LS_KEYS.USER_SESSION);
  window.dispatchEvent(new CustomEvent('localStorageChange', { 
    detail: { key: LS_KEYS.USER_SESSION } 
  }));
}
