'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Trash2,
  Share2,
  Sparkles,
  X,
  ArrowRight,
  Bell,
  Loader2,
} from 'lucide-react';
import { wishlistApi } from '@/lib/api';
import { useCart } from '@/contexts/cart-context';
import { useWishlist } from '@/contexts/wishlist-context';
import { productDisplayMap } from '@/lib/product-data';

const countryConfig = {
  in: { currency: '₹', country: 'IN' as const },
  ae: { currency: 'AED ', country: 'AE' as const },
  uk: { currency: '£', country: 'UK' as const },
};

interface WishlistItemDisplay {
  productId: string;
  name: string;
  category: string;
  price: number;
  weight: string;
  purity: string;
  inStock: boolean;
}

export default function WishlistPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const config = countryConfig[country];
  const { addItem: addToCart } = useCart();
  const { removeFromWishlist, refreshWishlist } = useWishlist();

  const [wishlistItems, setWishlistItems] = useState<WishlistItemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken')
            : null;
        if (!token) {
          setWishlistItems([]);
          return;
        }
        const data = await wishlistApi.get();
        const items = (data?.items ?? []) as { productId: string }[];
        const displayItems: WishlistItemDisplay[] = items
          .map((i) => {
            const prod = productDisplayMap[i.productId];
            if (!prod) return null;
            return { productId: i.productId, ...prod };
          })
          .filter((x): x is WishlistItemDisplay => x !== null);
        setWishlistItems(displayItems);
      } catch {
        setWishlistItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatPrice = (price: number) =>
    `${config.currency}${price.toLocaleString()}`;

  const handleRemove = async (productId: string) => {
    setActionLoading(productId);
    try {
      await removeFromWishlist(productId, config.country);
      setWishlistItems((prev) => prev.filter((i) => i.productId !== productId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddToCart = async (productId: string) => {
    setActionLoading(productId);
    try {
      await addToCart(productId, 1, config.country);
      await removeFromWishlist(productId, config.country);
      setWishlistItems((prev) => prev.filter((i) => i.productId !== productId));
      refreshWishlist();
    } catch (err) {
      console.error('Add to cart failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAllToCart = async () => {
    for (const item of wishlistItems.filter((i) => i.inStock)) {
      try {
        await addToCart(item.productId, 1, config.country);
        await removeFromWishlist(item.productId, config.country);
      } catch {
        // Remove failed - silently ignore
      }
    }
    setWishlistItems([]);
    refreshWishlist();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-cream-50 py-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
      </main>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-cream-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Save your favorite pieces to your wishlist and keep track of them here.
            </p>
            <Link
              href={`/${country}/collections`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
            >
              Explore Collections
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-50">
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                My Wishlist ({wishlistItems.length} items)
              </h1>
              <p className="text-gray-600 mt-1">Items you&apos;ve saved for later</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddAllToCart}
                disabled={wishlistItems.every((i) => !i.inStock)}
                className="flex items-center gap-2 px-6 py-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Add All to Cart
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden group"
                >
                  <Link href={`/${country}/product/${item.productId}`}>
                    <div className="relative aspect-square bg-gradient-to-br from-cream-100 to-cream-200">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-gold-300" />
                      </div>
                      {!item.inStock && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <span className="text-xs text-gold-600 font-medium">
                      {item.category}
                    </span>
                    <Link href={`/${country}/product/${item.productId}`}>
                      <h3 className="font-medium text-gray-900 mt-1 line-clamp-2 hover:text-gold-600">
                        {item.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <span>{item.purity}</span>
                      <span>•</span>
                      <span>{item.weight}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-gray-900">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="px-4 pb-4 pt-0 flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item.productId)}
                      disabled={!item.inStock || actionLoading === item.productId}
                      className="flex-1 py-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      {actionLoading === item.productId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : item.inStock ? (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          Add to Cart
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" />
                          Notify Me
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={actionLoading === item.productId}
                      className="p-2 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-12 bg-gradient-to-r from-gold-500 to-gold-600 rounded-2xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Get Price Drop Alerts</h3>
                  <p className="text-gold-100">
                    We&apos;ll notify you when prices drop on your wishlist items
                  </p>
                </div>
              </div>
              <Link
                href={`/${country}/price-alerts`}
                className="px-6 py-3 bg-white text-gold-600 font-medium rounded-lg hover:bg-cream-100 transition-colors"
              >
                Set Up Alerts
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
