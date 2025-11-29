import { useEffect, useState, useRef } from 'react';
import { getLocalCache, setLocalCache, LS_KEYS } from '@/lib/local-storage';
import { getCachedUserProfile, updateUserProfileCache, clearUserProfileCache } from '@/lib/user-profile-cache';
import type { User, Address } from '@/lib/types';

/**
 * Custom hook to fetch and cache user profile data
 * 🚀 OPTIMIZATION: Removed useSession to prevent multiple session API calls
 */
export function useUserProfile(userEmail?: string | null) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedEmailRef = useRef<string | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const email = userEmail || null;
    if (!email) {
      initializedEmailRef.current = null;
      setProfile(null);
      setLoading(false);
      return;
    }

    if (initializedEmailRef.current === email || fetchInProgressRef.current) {
      return;
    }

    initializedEmailRef.current = email;
    fetchInProgressRef.current = true;

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const cacheKey = `${LS_KEYS.USER_PROFILE}${email}`;
        const cachedProfile = getLocalCache<User>(cacheKey);

        if (cachedProfile) {
          setProfile(cachedProfile);
          setLoading(false);
          fetchInProgressRef.current = false;
          return;
        }

        const response = await fetch('/api/user/profile', {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (!cancelled) {
          setProfile(data);
          updateUserProfileCache(data);
          setLocalCache(cacheKey, data, 300); // 5 minutes cache
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error fetching profile:', err);
          setError(err.message || 'Failed to fetch profile data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchInProgressRef.current = false;
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
      fetchInProgressRef.current = false;
    };
  }, [userEmail]);

  // Function to force refresh profile data
  const refreshProfile = async () => {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      fetchInProgressRef.current = true;
      
      // Clear existing caches first
      clearUserProfileCache();
      const cacheKey = `${LS_KEYS.USER_PROFILE}${userEmail}`;
      localStorage.removeItem(cacheKey);
      
      // Fetch fresh data from server
      const response = await fetch('/api/user/profile', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      
      // Update local state immediately
      setProfile(data);
      
      // Create new cache entry with fresh data
      setLocalCache(cacheKey, data, 300);
      
      return data;
    } catch (err: any) {
      console.error('Error refreshing profile:', err);
      setError(err.message || 'Failed to refresh profile data');
      throw err;
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  return { profile, loading, error, refreshProfile };
}

/**
 * Custom hook to fetch and cache user addresses
 * 🚀 OPTIMIZATION: Removed useSession to prevent multiple session API calls
 */
export function useUserAddresses(userEmail?: string | null) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedEmailRef = useRef<string | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const email = userEmail || null;
    if (!email) {
      initializedEmailRef.current = null;
      setAddresses([]);
      setLoading(false);
      return;
    }

    if (initializedEmailRef.current === email || fetchInProgressRef.current) {
      return;
    }

    initializedEmailRef.current = email;
    fetchInProgressRef.current = true;

    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const cacheKey = `${LS_KEYS.USER_ADDRESSES}${email}`;
        const cachedAddresses = getLocalCache<Address[]>(cacheKey);

        if (cachedAddresses) {
          setAddresses(cachedAddresses);
          setLoading(false);
          fetchInProgressRef.current = false;
          return;
        }

        const response = await fetch('/api/user/addresses', {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch addresses');
        }

        const data = await response.json();
        setAddresses(data.addresses || []);
        setLocalCache(cacheKey, data.addresses || [], 300); // 5 minutes cache
      } catch (err: any) {
        console.error('Error fetching addresses:', err);
        setError(err.message || 'Failed to fetch address data');
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchAddresses();
  }, [userEmail]);

  // Function to update addresses (both state and cache)
  const updateAddresses = async (newAddresses: Partial<Address>[]) => {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      
      // Send to server
      const response = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: newAddresses }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update addresses');
      }
      
      const data = await response.json();
      setAddresses(data.addresses || []);
      
      // Update cache
      const cacheKey = `${LS_KEYS.USER_ADDRESSES}${userEmail}`;
      setLocalCache(cacheKey, data.addresses || [], 300);
      
      return data.addresses;
    } catch (err: any) {
      console.error('Error updating addresses:', err);
      setError(err.message || 'Failed to update addresses');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Function to delete an address
  const deleteAddress = async (addressId: string) => {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      
      // Send to server
      const response = await fetch(`/api/user/addresses?id=${addressId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete address');
      }
      
      const data = await response.json();
      setAddresses(data.addresses || []);
      
      // Update cache
      const cacheKey = `${LS_KEYS.USER_ADDRESSES}${userEmail}`;
      setLocalCache(cacheKey, data.addresses || [], 300);
      
      return data.addresses;
    } catch (err: any) {
      console.error('Error deleting address:', err);
      setError(err.message || 'Failed to delete address');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addresses, loading, error, updateAddresses, deleteAddress };
}