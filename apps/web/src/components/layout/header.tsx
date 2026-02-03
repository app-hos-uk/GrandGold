'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Heart,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { MiniCart } from '@/components/cart/mini-cart';
import { useWishlist } from '@/contexts/wishlist-context';

interface HeaderProps {
  country: 'in' | 'ae' | 'uk';
}

const countryConfig = {
  in: { name: 'India', flag: '🇮🇳', currency: 'INR' },
  ae: { name: 'UAE', flag: '🇦🇪', currency: 'AED' },
  uk: { name: 'UK', flag: '🇬🇧', currency: 'GBP' },
};

const navigation = [
  { name: 'Collections', href: '/collections' },
  { name: 'Necklaces', href: '/category/necklaces' },
  { name: 'Earrings', href: '/category/earrings' },
  { name: 'Rings', href: '/category/rings' },
  { name: 'Bracelets', href: '/category/bracelets' },
  { name: 'AR Try-On', href: '/ar-tryon', highlight: true },
];

export function Header({ country }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const countryInfo = countryConfig[country];
  const { wishlistCount } = useWishlist();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-cream-200">
      {/* Burgundy accent strip */}
      <div className="h-0.5 bg-gradient-to-r from-burgundy-900 via-burgundy-500 to-burgundy-900" />
      {/* Top bar with gold price and country selector */}
      <div className="bg-gray-900 text-white text-sm py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gold-400 font-medium">Live Gold:</span>
            <span>24K: ₹6,150/g</span>
            <span className="text-green-400 text-xs">▲ 0.5%</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-gold-400 transition-colors">
              <MapPin className="w-4 h-4" />
              <span>{countryInfo.flag} {countryInfo.name}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <Link href={`/${country}`} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-gold rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl font-semibold text-gray-900">
              Grand<span className="text-gold-500">Gold</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={`/${country}${item.href}`}
                className={`text-sm font-medium transition-colors hover:text-gold-600 ${
                  item.highlight
                    ? 'flex items-center gap-1 text-gold-600'
                    : 'text-gray-700'
                }`}
              >
                {item.highlight && <Sparkles className="w-4 h-4" />}
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:bg-cream-100 rounded-full transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link
              href={`/${country}/wishlist`}
              className="hidden sm:flex p-2 hover:bg-cream-100 rounded-full transition-colors relative"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart - Mini cart with live count */}
            <MiniCart country={country} />

            {/* Account */}
            <Link
              href={`/${country}/account`}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-cream-100 hover:bg-cream-200 rounded-full transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-cream-200"
          >
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={`/${country}${item.href}`}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    item.highlight
                      ? 'bg-gold-50 text-gold-600 font-medium'
                      : 'hover:bg-cream-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    {item.highlight && <Sparkles className="w-4 h-4" />}
                    {item.name}
                  </span>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-cream-200 mt-4">
                <Link
                  href={`/${country}/account`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-cream-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  <span>My Account</span>
                </Link>
                <Link
                  href={`/${country}/wishlist`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-cream-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-white p-6 shadow-luxury"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="container mx-auto max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search for gold necklaces, diamond rings..."
                    className="w-full pl-12 pr-4 py-4 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-lg"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-cream-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p className="font-medium mb-2">Popular searches:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Gold necklace', 'Diamond ring', 'Bridal set', '22K gold'].map((term) => (
                      <button
                        key={term}
                        className="px-3 py-1 bg-cream-100 hover:bg-cream-200 rounded-full transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
