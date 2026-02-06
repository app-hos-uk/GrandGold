'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  TrendingUp,
  Tag,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { MiniCart } from '@/components/cart/mini-cart';
import { useWishlist } from '@/contexts/wishlist-context';
import { useGoldRates } from '@/contexts/gold-rate-context';
import { Logo } from '@/components/brand/logo';
import {
  getSearchSuggestions,
  fuzzySearchProducts,
  type SearchSuggestion,
  type MockProduct,
  MOCK_PRODUCTS,
} from '@/lib/product-data';

type CountryCode = 'in' | 'ae' | 'uk';

interface HeaderProps {
  country: CountryCode;
}

const COUNTRY_OPTIONS: { code: CountryCode; name: string; flag: string; currency: string; symbol: string; goldRate: string }[] = [
  { code: 'in', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', goldRate: '6,150' },
  { code: 'ae', name: 'UAE', flag: '🇦🇪', currency: 'AED', symbol: 'AED ', goldRate: '242' },
  { code: 'uk', name: 'UK', flag: '🇬🇧', currency: 'GBP', symbol: '£', goldRate: '52' },
];

const countryConfig: Record<CountryCode, { name: string; flag: string; currency: string; symbol: string; goldRate: string }> = {
  in: { name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', goldRate: '6,150' },
  ae: { name: 'UAE', flag: '🇦🇪', currency: 'AED', symbol: 'AED ', goldRate: '242' },
  uk: { name: 'UK', flag: '🇬🇧', currency: 'GBP', symbol: '£', goldRate: '52' },
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

/* ------------------------------------------------------------------ */
/*  Enhanced Search Modal                                               */
/* ------------------------------------------------------------------ */

const POPULAR_SEARCHES = [
  { text: 'Gold Necklace', slug: 'necklaces' },
  { text: 'Diamond Ring', slug: 'rings' },
  { text: 'Bridal Set', slug: 'necklaces' },
  { text: '22K Bangles', slug: 'bangles' },
  { text: 'Earrings', slug: 'earrings' },
  { text: 'Pendants', slug: 'pendants' },
];

const TRENDING_CATEGORIES = [
  { name: 'Necklaces', slug: 'necklaces', count: MOCK_PRODUCTS.filter((p) => p.category === 'Necklaces').length },
  { name: 'Earrings', slug: 'earrings', count: MOCK_PRODUCTS.filter((p) => p.category === 'Earrings').length },
  { name: 'Rings', slug: 'rings', count: MOCK_PRODUCTS.filter((p) => p.category === 'Rings').length },
  { name: 'Bangles', slug: 'bangles', count: MOCK_PRODUCTS.filter((p) => p.category === 'Bangles').length },
  { name: 'Bracelets', slug: 'bracelets', count: MOCK_PRODUCTS.filter((p) => p.category === 'Bracelets').length },
  { name: 'Pendants', slug: 'pendants', count: MOCK_PRODUCTS.filter((p) => p.category === 'Pendants').length },
];

function SearchModal({ country, onClose }: { country: string; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [correction, setCorrection] = useState<string | null>(null);
  const [fuzzyResults, setFuzzyResults] = useState<MockProduct[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setCorrection(null);
      setFuzzyResults([]);
      setActiveIdx(-1);
      return;
    }

    const timer = setTimeout(() => {
      const s = getSearchSuggestions(query);
      setSuggestions(s);

      // If no direct suggestions, try fuzzy correction
      if (s.length === 0) {
        const { results, correction: corr } = fuzzySearchProducts(query);
        setCorrection(corr);
        setFuzzyResults(results);
      } else {
        setCorrection(null);
        setFuzzyResults([]);
      }
      setActiveIdx(-1);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = useCallback((path: string) => {
    router.push(path);
    onClose();
  }, [router, onClose]);

  const handleSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    navigateTo(`/${country}/collections?search=${encodeURIComponent(searchTerm.trim())}`);
  }, [country, navigateTo]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product' && suggestion.product) {
      navigateTo(`/${country}/product/${suggestion.product.id}`);
    } else if (suggestion.type === 'category' && suggestion.categorySlug) {
      navigateTo(`/${country}/category/${suggestion.categorySlug}`);
    } else {
      handleSearch(suggestion.text);
    }
  }, [country, navigateTo, handleSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + fuzzyResults.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        handleSuggestionClick(suggestions[activeIdx]);
      } else if (activeIdx >= suggestions.length && activeIdx < suggestions.length + fuzzyResults.length) {
        const product = fuzzyResults[activeIdx - suggestions.length];
        navigateTo(`/${country}/product/${product.id}`);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [activeIdx, suggestions, fuzzyResults, handleSuggestionClick, handleSearch, query, navigateTo, country, onClose]);

  // Highlight matching text
  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <span className="font-semibold text-gold-700">{text.substring(idx, idx + q.length)}</span>
        {text.substring(idx + q.length)}
      </>
    );
  };

  const typeIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product': return <ShoppingBag className="w-4 h-4 text-gold-500" />;
      case 'category': return <Tag className="w-4 h-4 text-blue-500" />;
      case 'tag': return <TrendingUp className="w-4 h-4 text-green-500" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const showDefaultContent = query.length < 2 && suggestions.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-white shadow-luxury max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container mx-auto max-w-2xl px-4 py-6">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for gold necklaces, diamond rings, bangles..."
              className="w-full pl-12 pr-12 py-4 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-lg"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-cream-100 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-cream-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Did you mean? correction */}
          {correction && (
            <div className="mt-3 px-2">
              <p className="text-sm text-gray-500">
                Did you mean{' '}
                <button
                  onClick={() => { setQuery(correction); }}
                  className="font-semibold text-gold-600 hover:text-gold-700 underline underline-offset-2"
                >
                  &ldquo;{correction}&rdquo;
                </button>
                ?
              </p>
            </div>
          )}

          <div className="mt-4 max-h-[55vh] overflow-y-auto">
            {/* Autocomplete suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Suggestions</p>
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.type}-${s.text}-${i}`}
                    onClick={() => handleSuggestionClick(s)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
                      activeIdx === i ? 'bg-gold-50 border border-gold-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    {typeIcon(s.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{highlightMatch(s.text, query)}</p>
                      {s.type === 'product' && s.product && (
                        <p className="text-xs text-gray-400">
                          {s.product.category} • {s.product.purity} {s.product.metalType === 'gold' ? 'Gold' : s.product.metalType} • ₹{s.product.price.toLocaleString('en-IN')}
                        </p>
                      )}
                      {s.type === 'category' && (
                        <p className="text-xs text-blue-400">Browse category</p>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </button>
                ))}

                {/* Show search for query button */}
                <button
                  onClick={() => handleSearch(query)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-gray-50 transition-colors mt-1 border-t border-gray-100"
                >
                  <Search className="w-4 h-4 text-gold-500" />
                  <span className="text-sm text-gold-700 font-medium">Search for &ldquo;{query}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 ml-auto" />
                </button>
              </div>
            )}

            {/* Fuzzy-corrected results */}
            {fuzzyResults.length > 0 && suggestions.length === 0 && (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">
                  {correction ? `Results for "${correction}"` : 'Results'}
                </p>
                {fuzzyResults.slice(0, 5).map((product, i) => (
                  <button
                    key={product.id}
                    onClick={() => navigateTo(`/${country}/product/${product.id}`)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
                      activeIdx === suggestions.length + i ? 'bg-gold-50 border border-gold-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-100 to-cream-200 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-gold-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate font-medium">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category} • {product.purity} • {product.weight}</p>
                    </div>
                    <p className="text-sm font-semibold text-gold-700 flex-shrink-0">₹{product.price.toLocaleString('en-IN')}</p>
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {query.length >= 2 && suggestions.length === 0 && fuzzyResults.length === 0 && !correction && (
              <div className="text-center py-8">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-gray-400 mt-1">Try different keywords or browse our categories below</p>
              </div>
            )}

            {/* Default content: Popular searches + Trending categories */}
            {showDefaultContent && (
              <>
                <div className="mb-6">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-3">Popular searches</p>
                  <div className="flex flex-wrap gap-2 px-2">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term.text}
                        onClick={() => setQuery(term.text)}
                        className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 rounded-full transition-colors text-sm text-gray-700"
                      >
                        {term.text}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-3">Browse categories</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-2">
                    {TRENDING_CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => navigateTo(`/${country}/category/${cat.slug}`)}
                        className="flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gold-50 rounded-lg transition-colors group"
                      >
                        <span className="text-sm text-gray-700 group-hover:text-gold-700 font-medium">{cat.name}</span>
                        <span className="text-xs text-gray-400 group-hover:text-gold-500">{cat.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent searches (from localStorage) */}
                <RecentSearches country={country} onSelect={setQuery} onNavigate={navigateTo} />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent searches (persisted in localStorage)                         */
/* ------------------------------------------------------------------ */

const RECENT_SEARCHES_KEY = 'grandgold_recent_searches';

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(term: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentSearches();
    const updated = [term, ...existing.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function RecentSearches({ country, onSelect, onNavigate }: { country: string; onSelect: (q: string) => void; onNavigate: (path: string) => void }) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  if (recent.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between px-2 mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent searches</p>
        <button
          onClick={() => {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
            setRecent([]);
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2 px-2">
        {recent.map((term) => (
          <button
            key={term}
            onClick={() => onSelect(term)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-sm text-gray-600"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header Component                                                    */
/* ------------------------------------------------------------------ */

export function Header({ country }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const countryInfo = countryConfig[country];
  const { wishlistCount } = useWishlist();

  // Use shared gold rate context (single fetch shared with homepage)
  const { liveRateDisplay: liveGoldRate, updatedAt: rateUpdatedAt, symbol: rateSymbol } = useGoldRates();

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
            {rateUpdatedAt ? (
              <span className="text-gray-400 text-xs" title="Last updated time">
                Updated {rateUpdatedAt}
              </span>
            ) : (
              <span className="text-gray-400 text-xs">Fallback</span>
            )}
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

      {/* Enhanced search modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <SearchModal
            country={country}
            onClose={() => setIsSearchOpen(false)}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
