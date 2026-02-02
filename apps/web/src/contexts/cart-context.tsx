'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cartApi } from '@/lib/api';

const CART_ID_KEY = 'grandgold_cart_id';

interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  purity?: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  currency: string;
  country: string;
}

interface CartContextValue {
  cart: Cart | null;
  cartId: string | null;
  isLoading: boolean;
  itemCount: number;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, country?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  saveForLater: (productIds: string[]) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  country = 'IN',
}: {
  children: React.ReactNode;
  country?: string;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const countryCode = country.toUpperCase() as 'IN' | 'AE' | 'UK';

  const refreshCart = useCallback(async () => {
    try {
      let cid = cartId;
      if (!cid && typeof window !== 'undefined') {
        cid = localStorage.getItem(CART_ID_KEY);
      }
      if (!cid) {
        const session = await cartApi.getSession();
        cid = session.cartId;
        if (cid) {
          setCartId(cid);
          if (!session.isLoggedIn && typeof window !== 'undefined') {
            localStorage.setItem(CART_ID_KEY, cid);
          }
        }
      }
      if (cid) {
        const data = await cartApi.get(cid);
        setCart(data);
      }
    } catch (err) {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [cartId]);

  useEffect(() => {
    const init = async () => {
      try {
        let cid: string | null = null;
        if (typeof window !== 'undefined') {
          cid = localStorage.getItem(CART_ID_KEY);
        }
        const session = await cartApi.getSession();
        if (session.isLoggedIn) {
          cid = session.cartId;
          if (typeof window !== 'undefined') {
            localStorage.removeItem(CART_ID_KEY);
          }
        } else if (!cid) {
          cid = session.cartId;
          if (typeof window !== 'undefined') {
            localStorage.setItem(CART_ID_KEY, cid);
          }
        }
        setCartId(cid);
        const data = await cartApi.get(cid);
        setCart(data);
      } catch {
        setCart(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const addItem = useCallback(
    async (productId: string, quantity = 1, country?: string) => {
      let cid = cartId;
      if (!cid) {
        const session = await cartApi.getSession();
        cid = session.cartId;
        setCartId(cid);
        if (!session.isLoggedIn && typeof window !== 'undefined') {
          localStorage.setItem(CART_ID_KEY, cid);
        }
      }
      await cartApi.addItem({
        productId,
        quantity,
        cartId: cid,
        country: country || countryCode,
      });
      await refreshCart();
    },
    [cartId, countryCode, refreshCart]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!cartId) return;
      await cartApi.updateQuantity(productId, quantity, cartId);
      await refreshCart();
    },
    [cartId, refreshCart]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (!cartId) return;
      await cartApi.removeItem(productId, cartId);
      await refreshCart();
    },
    [cartId, refreshCart]
  );

  const saveForLater = useCallback(
    async (productIds: string[]) => {
      if (!cartId) return;
      await cartApi.saveForLater(productIds, cartId);
      await refreshCart();
    },
    [cartId, refreshCart]
  );

  const value: CartContextValue = {
    cart,
    cartId,
    isLoading,
    itemCount: cart?.itemCount ?? 0,
    refreshCart,
    addItem,
    updateQuantity,
    removeItem,
    saveForLater,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
