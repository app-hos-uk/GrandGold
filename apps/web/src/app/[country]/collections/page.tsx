'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Grid3X3,
  LayoutList,
  Heart,
  Sparkles,
  SlidersHorizontal,
  X,
  ShoppingBag,
  Minus,
  Plus,
  Share2,
  Check,
  Truck,
  Shield,
  RotateCcw,
  ZoomIn,
  Search,
} from 'lucide-react';
import { VisualSearch } from '@/components/search/visual-search';
import { MOCK_PRODUCTS, fuzzySearchProducts } from '@/lib/product-data';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: string;
  purity: string;
  image: string;
  isNew: boolean;
  description?: string;
  inStock?: boolean;
}

// Use shared product data as source of truth
const products: Product[] = MOCK_PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  weight: p.weight,
  purity: p.purity,
  image: p.images[0] || '/products/placeholder.jpg',
  isNew: p.newArrival,
  description: p.description,
  inStock: p.inStock,
}));

const categories = ['All', ...new Set(MOCK_PRODUCTS.map((p) => p.category))];
const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First'];
const purityOptions = ['All', '24K', '22K', '18K', '14K'];

const countryConfig = {
  in: { currency: '₹', currencyCode: 'INR' },
  ae: { currency: 'AED ', currencyCode: 'AED' },
  uk: { currency: '£', currencyCode: 'GBP' },
};

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading collections...</div></div>}>
      <CollectionsContent />
    </Suspense>
  );
}

function CollectionsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const config = countryConfig[country];

  // Read search query from URL (set by search bar)
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Featured');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPurity, setSelectedPurity] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedToWishlist, setAddedToWishlist] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [searchCorrection, setSearchCorrection] = useState<string | null>(null);

  // Sync URL search param on mount
  useEffect(() => {
    if (urlSearch) setSearchQuery(urlSearch);
    if (urlCategory) {
      // Map URL slug to category name (e.g., "traditional-bridal" -> try matching)
      const matchingCat = categories.find(
        (c) => c.toLowerCase() === urlCategory.toLowerCase() || c.toLowerCase().replace(/\s+/g, '-') === urlCategory.toLowerCase()
      );
      if (matchingCat) setSelectedCategory(matchingCat);
    }
  }, [urlSearch, urlCategory]);

  // Compute search results & correction (pure computation, no setState during render)
  const { searchPool, computedCorrection } = (() => {
    if (!searchQuery.trim()) return { searchPool: products, computedCorrection: null };
    const { results, correction } = fuzzySearchProducts(searchQuery.trim());
    if (results.length > 0) {
      const matchIds = new Set(results.map((r) => r.id));
      return { searchPool: products.filter((p) => matchIds.has(p.id)), computedCorrection: correction };
    }
    return { searchPool: [] as Product[], computedCorrection: correction };
  })();

  // Sync correction state via useEffect (avoids setState during render)
  useEffect(() => {
    setSearchCorrection(computedCorrection);
  }, [computedCorrection]);

  // Dynamic page title
  useEffect(() => {
    const parts = ['Collections'];
    if (searchQuery) parts.push(`Search: ${searchQuery}`);
    if (selectedCategory !== 'All') parts.push(selectedCategory);
    document.title = `${parts.join(' - ')} | GrandGold`;
  }, [searchQuery, selectedCategory]);

  // Apply category / purity / price filters
  const filteredProducts = searchPool.filter((product) => {
    if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;
    if (selectedPurity !== 'All' && product.purity !== selectedPurity) return false;
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
    return true;
  });

  const formatPrice = (price: number) => {
    return `${config.currency}${price.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Hero Banner */}
      <section className="bg-gradient-luxury py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Our Collections
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our exquisite range of handcrafted gold and diamond jewellery,
              each piece telling its own story of elegance and tradition.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters and Products */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Visual Search */}
          <div className="mb-6 max-w-md">
            <VisualSearch country={country} />
          </div>

          {/* Search bar (pre-filled from header search) */}
          {(searchQuery || urlSearch) && (
            <div className="mb-6">
              <div className="relative max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-12 pr-12 py-3 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-cream-100 rounded text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchCorrection && (
                <p className="mt-2 text-sm text-gray-500">
                  Showing results for{' '}
                  <button
                    onClick={() => setSearchQuery(searchCorrection)}
                    className="font-semibold text-gold-600 hover:text-gold-700 underline underline-offset-2"
                  >
                    &ldquo;{searchCorrection}&rdquo;
                  </button>
                  {' '}instead of &ldquo;{searchQuery}&rdquo;
                </p>
              )}
              {searchQuery && filteredProducts.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for &ldquo;{searchCorrection || searchQuery}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gold-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-cream-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-cream-200 hover:border-gold-500 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              <span className="text-gray-500 text-sm">
                {filteredProducts.length} products
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 bg-white rounded-lg border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex items-center bg-white rounded-lg border border-cream-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid' ? 'bg-gold-100 text-gold-600' : 'text-gray-400'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list' ? 'bg-gold-100 text-gold-600' : 'text-gray-400'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <motion.aside
              initial={false}
              animate={{ width: showFilters ? 280 : 0, opacity: showFilters ? 1 : 0 }}
              className="hidden lg:block overflow-hidden"
            >
              <div className="w-[280px] bg-white rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1 hover:bg-cream-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Purity Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Gold Purity</h4>
                  <div className="space-y-2">
                    {purityOptions.map((purity) => (
                      <label
                        key={purity}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="purity"
                          checked={selectedPurity === purity}
                          onChange={() => setSelectedPurity(purity)}
                          className="w-4 h-4 text-gold-500 focus:ring-gold-500"
                        />
                        <span className="text-sm">{purity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="500000"
                      step="10000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-gold-500"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedPurity('All');
                    setPriceRange([0, 500000]);
                  }}
                  className="w-full py-2 text-sm text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </motion.aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/${country}/product/${product.id}`}>
                      <div
                        className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury transition-all ${
                          viewMode === 'list' ? 'flex' : ''
                        }`}
                      >
                        {/* Image */}
                        <div
                          className={`relative bg-gradient-to-br from-cream-100 to-cream-200 ${
                            viewMode === 'list' ? 'w-48 h-48' : 'aspect-square'
                          }`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-16 h-16 text-gold-300" />
                          </div>
                          
                          {product.isNew && (
                            <span className="absolute top-3 left-3 px-2 py-1 bg-gold-500 text-white text-xs font-medium rounded">
                              NEW
                            </span>
                          )}
                          
                          <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                            <Heart className="w-4 h-4" />
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuickViewProduct(product);
                                setQuantity(1);
                                setAddedToCart(false);
                                setAddedToWishlist(false);
                              }}
                              className="w-full py-2 bg-white text-sm font-medium rounded-lg hover:bg-gold-50 transition-colors flex items-center justify-center gap-2"
                            >
                              <ZoomIn className="w-4 h-4" />
                              Quick View
                            </button>
                          </div>
                        </div>

                        {/* Details */}
                        <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                          <span className="text-xs text-gold-600 font-medium">
                            {product.category}
                          </span>
                          <h3 className="font-medium text-gray-900 mt-1 line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <span>{product.purity}</span>
                            <span>•</span>
                            <span>{product.weight}</span>
                          </div>
                          <p className="mt-3 text-lg font-semibold text-gray-900">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <Sparkles className="w-16 h-16 text-gold-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters to find what you&apos;re looking for.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setQuickViewProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid md:grid-cols-2">
                {/* Image Section */}
                <div className="relative bg-gradient-to-br from-cream-100 to-cream-200 p-8 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                  <Sparkles className="w-32 h-32 text-gold-300" />
                  
                  {quickViewProduct.isNew && (
                    <span className="absolute top-4 left-4 px-3 py-1 bg-gold-500 text-white text-sm font-medium rounded-full">
                      NEW
                    </span>
                  )}
                  
                  {!quickViewProduct.inStock && (
                    <span className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-6 md:p-8">
                  <span className="text-sm text-gold-600 font-medium">
                    {quickViewProduct.category}
                  </span>
                  <h2 className="text-2xl font-semibold text-gray-900 mt-2">
                    {quickViewProduct.name}
                  </h2>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(quickViewProduct.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Purity:</span> {quickViewProduct.purity}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Weight:</span> {quickViewProduct.weight}
                    </span>
                  </div>
                  
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    {quickViewProduct.description}
                  </p>
                  
                  {/* Quantity Selector */}
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold text-lg">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setAddedToCart(true);
                        setTimeout(() => setAddedToCart(false), 2000);
                      }}
                      disabled={!quickViewProduct.inStock}
                      className={`flex-1 py-3 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                        addedToCart
                          ? 'bg-green-500 text-white'
                          : quickViewProduct.inStock
                          ? 'bg-gold-500 hover:bg-gold-600 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {addedToCart ? (
                        <>
                          <Check className="w-5 h-5" />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          {quickViewProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAddedToWishlist(!addedToWishlist);
                      }}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all ${
                        addedToWishlist
                          ? 'bg-red-50 text-red-500 border-2 border-red-500'
                          : 'border-2 border-gray-200 text-gray-500 hover:border-gold-500 hover:text-gold-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${addedToWishlist ? 'fill-red-500' : ''}`} />
                    </button>
                    <button className="w-12 h-12 flex items-center justify-center border-2 border-gray-200 text-gray-500 hover:border-gold-500 hover:text-gold-500 rounded-lg transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Features */}
                  <div className="mt-6 pt-6 border-t border-cream-200 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Truck className="w-5 h-5 text-gold-500" />
                      <span>Free shipping on orders above {formatPrice(10000)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Shield className="w-5 h-5 text-gold-500" />
                      <span>BIS Hallmarked & Certified</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <RotateCcw className="w-5 h-5 text-gold-500" />
                      <span>15-day easy returns</span>
                    </div>
                  </div>
                  
                  {/* View Full Details */}
                  <Link
                    href={`/${country}/product/${quickViewProduct.id}`}
                    className="block mt-6 text-center py-3 border-2 border-gold-500 text-gold-600 font-medium rounded-lg hover:bg-gold-50 transition-colors"
                    onClick={() => setQuickViewProduct(null)}
                  >
                    View Full Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
