'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Logo } from '@/components/brand/logo';

type CountryCode = 'in' | 'ae' | 'uk';

interface HeaderProps {
  country: CountryCode;
}

const COUNTRY_OPTIONS: { code: CountryCode; name: string; flag: string; currency: string; symbol: string; goldRate: string }[] = [
  { code: 'in', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', goldRate: '6,150' },
  { code: 'ae', name: 'UAE', flag: '🇦🇪', currency: 'AED', symbol: 'AED ', goldRate: '615' },
  { code: 'uk', name: 'UK', flag: '🇬🇧', currency: 'GBP', symbol: '£', goldRate: '6,150' },
];

const countryConfig: Record<CountryCode, { name: string; flag: string; currency: string; symbol: string; goldRate: string }> = {
  in: { name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', goldRate: '6,150' },
  ae: { name: 'UAE', flag: '🇦🇪', currency: 'AED', symbol: 'AED ', goldRate: '615' },
  uk: { name: 'UK', flag: '🇬🇧', currency: 'GBP', symbol: '£', goldRate: '6,150' },
};

const navigation = [
  { name: 'Collections', href: '/collections' },
  { name: 'Necklaces', href: '/category/necklaces' },
  { name: 'Earrings', href: '/category/earrings' },
  { name: 'Rings', href: '/category/rings' },
  { name: 'Bracelets', href: '/category/bracelets' },
  { name: 'AR Try-On', href: '/ar-tryon', highlight: true },
];

function setCountryCookie(code: CountryCode) {
  if (typeof document === 'undefined') return;
  document.cookie = `country=${code};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

const countryToCurrency: Record<CountryCode, string> = {
  in: 'INR',
  ae: 'AED',
  uk: 'GBP',
};

export function Header({ country }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [liveGoldRate, setLiveGoldRate] = useState<string | null>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const countryInfo = countryConfig[country];
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    let cancelled = false;
    const currency = countryToCurrency[country];
    fetch('/api/rates/metals')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { gold?: Record<string, number> } | null) => {
        if (cancelled) return;
        const rate = data?.gold?.[currency];
        if (typeof rate === 'number') {
          setLiveGoldRate(rate >= 1000 ? rate.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : String(rate));
        } else {
          setLiveGoldRate(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLiveGoldRate(null);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (code: CountryCode) => {
    setCountryCookie(code);
    setIsCountryOpen(false);
    router.push(`/${code}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-cream-200">
      {/* Burgundy accent strip */}
      <div className="h-0.5 bg-gradient-to-r from-burgundy-900 via-burgundy-500 to-burgundy-900" />
      {/* Top bar with gold price and country selector */}
      <div className="bg-gray-900 text-white text-sm py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gold-400 font-medium">Live Gold:</span>
            <span>24K: {countryInfo.symbol}{liveGoldRate ?? countryInfo.goldRate}/g</span>
            <span className="text-green-400 text-xs">▲ 0.5%</span>
          </div>
          
          <div className="flex items-center gap-4 relative" ref={countryRef}>
            <button
              type="button"
              onClick={() => setIsCountryOpen((o) => !o)}
              className="flex items-center gap-1 hover:text-gold-400 transition-colors"
              aria-expanded={isCountryOpen}
              aria-haspopup="listbox"
              aria-label="Select country"
            >
              <MapPin className="w-4 h-4" />
              <span>{countryInfo.flag} {countryInfo.name}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isCountryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 py-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-w-[160px] z-50"
                  role="listbox"
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      role="option"
                      aria-selected={country === opt.code}
                      onClick={() => handleCountrySelect(opt.code)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${country === opt.code ? 'bg-gold-600/20 text-gold-400' : ''}`}
                    >
                      <span>{opt.flag}</span>
                      <span>{opt.name}</span>
                      <span className="text-gray-400 text-xs">({opt.symbol.trim() || opt.currency})</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
          <Logo href={`/${country}`} className="h-10 w-auto" variant="light" />

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
