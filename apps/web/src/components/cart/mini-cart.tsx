'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniCartProps {
  country: 'in' | 'ae' | 'uk';
}

const countryConfig = {
  in: { currency: '₹' },
  ae: { currency: 'AED ' },
  uk: { currency: '£' },
};

export function MiniCart({ country }: MiniCartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, itemCount, updateQuantity, removeItem } = useCart();
  const config = countryConfig[country];

  const formatPrice = (price: number) =>
    `${config.currency}${price.toLocaleString()}`;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-cream-100 rounded-full transition-colors relative"
        aria-label={`Cart with ${itemCount} items`}
      >
        <ShoppingBag className="w-5 h-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] bg-white rounded-2xl shadow-luxury z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-cream-200 flex items-center justify-between">
                <h3 className="font-semibold">Your Cart ({itemCount} items)</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-cream-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {!cart || cart.items.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="divide-y divide-cream-100">
                    {cart.items.map((item) => (
                      <div
                        key={item.productId}
                        className="p-4 flex gap-3 hover:bg-cream-50"
                      >
                        <div className="w-16 h-16 bg-cream-100 rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="w-6 h-6 flex items-center justify-center bg-cream-100 rounded hover:bg-cream-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="w-6 h-6 flex items-center justify-center bg-cream-100 rounded hover:bg-cream-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart && cart.items.length > 0 && (
                <div className="p-4 border-t border-cream-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Subtotal</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  <Link
                    href={`/${country}/cart`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full py-3 bg-gold-500 hover:bg-gold-600 text-white text-center font-medium rounded-lg transition-colors"
                  >
                    View Cart
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
