import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getLocalCache, setLocalCache, LS_KEYS } from '@/lib/local-storage';
import type { User, Address } from '@/lib/types';

/**
 * Custom hook to fetch and cache user profile data
 * Uses localStorage for caching to avoid Redis usage for individual user data
 */
export function useUserProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check localStorage cache first
        const cacheKey = `${LS_KEYS.USER_PROFILE}${session.user.email}`;
        const cachedProfile = getLocalCache<User>(cacheKey);
        
        if (cachedProfile) {
          console.log('Using cached profile data');
          setProfile(cachedProfile);
          setLoading(false);
          return;
        }

        // Fetch from server if no cache
        const response = await fetch('/api/user/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
        
        // Cache the profile data
        setLocalCache(cacheKey, data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  // Function to force refresh profile data
  const refreshProfile = async () => {
    if (!session?.user?.email) return;
    
    try {
      setLoading(true);
      
      // Clear existing cache first
      const cacheKey = `${LS_KEYS.USER_PROFILE}${session.user.email}`;
      localStorage.removeItem(cacheKey);
      
      // Fetch fresh data from server
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      
      // Update local state immediately
      setProfile(data);
      
      // Create new cache entry with fresh data
      setLocalCache(cacheKey, data);
      
      return data;
    } catch (err: any) {
      console.error('Error refreshing profile:', err);
      setError(err.message || 'Failed to refresh profile data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, refreshProfile };
}

/**
 * Custom hook to fetch and cache user addresses
 * Uses localStorage for caching to avoid Redis usage for individual user data
 */
export function useUserAddresses() {
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check localStorage cache first
        const cacheKey = `${LS_KEYS.USER_ADDRESSES}${session.user.email}`;
        const cachedAddresses = getLocalCache<Address[]>(cacheKey);
        
        if (cachedAddresses) {
          console.log('Using cached address data');
          setAddresses(cachedAddresses);
          setLoading(false);
          return;
        }

        // Fetch from server if no cache
        const response = await fetch('/api/user/addresses');
        
        if (!response.ok) {
          throw new Error('Failed to fetch addresses');
        }
        
        const data = await response.json();
        setAddresses(data.addresses || []);
        
        // Cache the address data
        setLocalCache(cacheKey, data.addresses || []);
      } catch (err: any) {
        console.error('Error fetching addresses:', err);
        setError(err.message || 'Failed to fetch address data');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [session]);

  // Function to update addresses (both state and cache)
  const updateAddresses = async (newAddresses: Partial<Address>[]) => {
    if (!session?.user?.email) return;
    
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
      const cacheKey = `${LS_KEYS.USER_ADDRESSES}${session.user.email}`;
      setLocalCache(cacheKey, data.addresses || []);
      
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
    if (!session?.user?.email) return;
    
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
      const cacheKey = `${LS_KEYS.USER_ADDRESSES}${session.user.email}`;
      setLocalCache(cacheKey, data.addresses || []);
      
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