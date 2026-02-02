'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Tag,
  Truck,
  Shield,
  ArrowRight,
  Sparkles,
  Heart,
  Lock,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { wishlistApi } from '@/lib/api';

const countryConfig = {
  in: { currency: '₹', shipping: 0, tax: 3 },
  ae: { currency: 'AED ', shipping: 0, tax: 5 },
  uk: { currency: '£', shipping: 0, tax: 20 },
};

export default function CartPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const config = countryConfig[country];
  const { cart, isLoading, updateQuantity, removeItem, saveForLater } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);

  const cartItems = cart?.items ?? [];
  const formatPrice = (price: number) =>
    `${config.currency}${price.toLocaleString()}`;

  const handleSaveForLater = async (productId: string) => {
    setSavingItem(productId);
    try {
      await saveForLater([productId]);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken')
          : null;
      if (token) {
        const countryCode = country.toUpperCase();
        await wishlistApi.add(productId, countryCode);
      }
    } catch {
      // Save for later failed - silently ignore
    } finally {
      setSavingItem(null);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const shipping = config.shipping;
  const tax = (subtotal - discount) * (config.tax / 100);
  const total = subtotal - discount + shipping + tax;

  const applyPromo = () => {
    if (promoCode.toLowerCase() === 'gold10') {
      setPromoApplied(true);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-cream-50 py-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-cream-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven&apos;t added any jewellery to your cart yet.
            </p>
            <Link
              href={`/${country}/collections`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
            >
              Start Shopping
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">
            Shopping Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-white rounded-2xl p-6"
                  >
                    <div className="flex gap-6">
                      {/* Image */}
                      <div className="w-28 h-28 bg-gradient-to-br from-cream-100 to-cream-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-12 h-12 text-gold-400" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 mt-1">
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              {item.purity && <span>{item.purity}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {/* Quantity */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="w-8 h-8 flex items-center justify-center bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="w-8 h-8 flex items-center justify-center bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-cream-100">
                      <button
                        onClick={() => handleSaveForLater(item.productId)}
                        disabled={savingItem === item.productId}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gold-600 disabled:opacity-50"
                      >
                        {savingItem === item.productId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4" />
                        )}
                        Save for Later
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Continue Shopping */}
              <Link
                href={`/${country}/collections`}
                className="block text-center py-4 text-gold-600 hover:text-gold-700 font-medium"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

                {/* Promo Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        disabled={promoApplied}
                        className="w-full pl-10 pr-4 py-2 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-gray-50"
                      />
                    </div>
                    <button
                      onClick={applyPromo}
                      disabled={promoApplied || !promoCode}
                      className="px-4 py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      10% discount applied!
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Try &quot;GOLD10&quot; for 10% off
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (10%)</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({config.tax}%)</span>
                    <span>{formatPrice(Math.round(tax))}</span>
                  </div>
                  <div className="h-px bg-cream-200" />
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(Math.round(total))}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  href={`/${country}/checkout`}
                  className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Secure Checkout
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-cream-200">
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span>Free Shipping</span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400 mb-2">We accept</p>
                  <div className="flex items-center justify-center gap-2">
                    {['Visa', 'MC', 'Amex', 'UPI'].map((method) => (
                      <span
                        key={method}
                        className="px-2 py-1 bg-cream-100 text-xs text-gray-600 rounded"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
