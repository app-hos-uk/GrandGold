'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wishlistApi } from '@/lib/api';

interface WishlistContextValue {
  wishlistCount: number;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string, country: string) => Promise<void>;
  removeFromWishlist: (productId: string, country: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  children,
  country = 'in',
}: {
  children: React.ReactNode;
  country?: string;
}) {
  const [wishlistCount, setWishlistCount] = useState(0);
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const countryCode = country.toUpperCase();

  const refreshWishlist = useCallback(async () => {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken')
          : null;
      if (!token) {
        setWishlistCount(0);
        setProductIds(new Set());
        return;
      }
      const data = await wishlistApi.get();
      const items = data?.items ?? [];
      setWishlistCount(items.length);
      setProductIds(new Set(items.map((i: { productId: string }) => i.productId)));
    } catch {
      setWishlistCount(0);
      setProductIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds]
  );

  const addToWishlist = useCallback(
    async (productId: string, countryParam?: string) => {
      try {
        await wishlistApi.add(productId, countryParam || countryCode);
        setProductIds((prev) => new Set([...prev, productId]));
        setWishlistCount((c) => c + 1);
      } catch (err) {
        console.error('Add to wishlist failed', err);
      }
    },
    [countryCode]
  );

  const removeFromWishlist = useCallback(
    async (productId: string, countryParam?: string) => {
      try {
        await wishlistApi.remove(productId, countryParam || countryCode);
        setProductIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        setWishlistCount((c) => Math.max(0, c - 1));
      } catch {
        // Remove from wishlist failed - silently ignore
      }
    },
    [countryCode]
  );

  const value: WishlistContextValue = {
    wishlistCount,
    isLoading,
    refreshWishlist,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      wishlistCount: 0,
      isLoading: false,
      refreshWishlist: async () => {},
      isInWishlist: () => false,
      addToWishlist: async () => {},
      removeFromWishlist: async () => {},
    };
  }
  return ctx;
}
