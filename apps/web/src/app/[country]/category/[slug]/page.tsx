'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
  ChevronRight,
  ShoppingBag,
  Minus,
  Plus,
  Share2,
  Check,
  Truck,
  Shield,
  RotateCcw,
  ZoomIn,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  weight: string;
  purity: string;
  isNew: boolean;
  description?: string;
  inStock?: boolean;
}

const categoryData: Record<string, { title: string; description: string; banner: string }> = {
  necklaces: {
    title: 'Necklaces',
    description: 'From delicate chains to statement chokers, find the perfect necklace to complement your style.',
    banner: '/banners/necklaces.jpg',
  },
  earrings: {
    title: 'Earrings',
    description: 'Discover our stunning collection of earrings, from classic studs to elegant jhumkas.',
    banner: '/banners/earrings.jpg',
  },
  rings: {
    title: 'Rings',
    description: 'Find your perfect ring, from engagement bands to everyday elegance.',
    banner: '/banners/rings.jpg',
  },
  bracelets: {
    title: 'Bracelets',
    description: 'Adorn your wrists with our exquisite collection of bangles and bracelets.',
    banner: '/banners/bracelets.jpg',
  },
  'gold-bars': {
    title: 'Gold Bars',
    description: 'Invest in certified gold bars with guaranteed purity and competitive rates.',
    banner: '/banners/gold-bars.jpg',
  },
};

const productsByCategory: Record<string, Product[]> = {
  necklaces: [
    { id: '1', name: 'Traditional Kundan Necklace Set', price: 185000, weight: '45.5g', purity: '22K', isNew: true, description: 'Exquisite handcrafted Kundan necklace set featuring intricate meenakari work. Perfect for weddings and special occasions.', inStock: true },
    { id: '2', name: 'Temple Design Choker', price: 295000, weight: '58.2g', purity: '22K', isNew: true, description: 'Magnificent temple design choker inspired by ancient South Indian temple architecture.', inStock: false },
    { id: '3', name: 'Layered Gold Chain', price: 65000, weight: '18.5g', purity: '22K', isNew: false, description: 'Elegant layered gold chain perfect for everyday wear or layering with other necklaces.', inStock: true },
    { id: '4', name: 'Diamond Pendant Necklace', price: 145000, weight: '12.3g', purity: '18K', isNew: false, description: 'Stunning diamond pendant on a delicate gold chain. A timeless piece for any occasion.', inStock: true },
    { id: '5', name: 'Antique Gold Haar', price: 425000, weight: '85.0g', purity: '22K', isNew: true, description: 'Royal antique gold haar with intricate handcrafted details. A statement piece for grand occasions.', inStock: true },
    { id: '6', name: 'Contemporary Rose Gold Chain', price: 55000, weight: '15.0g', purity: '18K', isNew: false, description: 'Modern rose gold chain with minimalist design. Perfect for the contemporary woman.', inStock: true },
  ],
  earrings: [
    { id: '7', name: 'Diamond Studded Jhumkas', price: 78500, weight: '12.3g', purity: '18K', isNew: false, description: 'Beautiful diamond-studded jhumkas crafted in 18K gold with sparkling diamonds.', inStock: true },
    { id: '8', name: 'Pearl Drop Earrings', price: 45000, weight: '8.5g', purity: '18K', isNew: false, description: 'Elegant pearl drop earrings featuring lustrous freshwater pearls set in 18K gold.', inStock: true },
    { id: '9', name: 'Gold Chandbalis', price: 95000, weight: '22.0g', purity: '22K', isNew: true, description: 'Traditional chandbali earrings with crescent moon design and intricate filigree work.', inStock: true },
    { id: '10', name: 'Diamond Studs', price: 125000, weight: '4.5g', purity: '18K', isNew: false, description: 'Classic diamond stud earrings with brilliant-cut diamonds. Timeless elegance for everyday wear.', inStock: true },
    { id: '11', name: 'Temple Jhumkas', price: 85000, weight: '18.5g', purity: '22K', isNew: true, description: 'Ornate temple jhumkas inspired by traditional South Indian designs.', inStock: false },
    { id: '12', name: 'Contemporary Hoops', price: 35000, weight: '8.0g', purity: '18K', isNew: false, description: 'Modern hoop earrings with a sleek design. Versatile for work or play.', inStock: true },
  ],
  rings: [
    { id: '13', name: 'Solitaire Engagement Ring', price: 245000, weight: '8.2g', purity: '18K', isNew: true, description: 'Stunning solitaire engagement ring featuring a brilliant-cut diamond set in 18K white gold.', inStock: true },
    { id: '14', name: 'Diamond Eternity Band', price: 165000, weight: '5.8g', purity: '18K', isNew: false, description: 'Exquisite diamond eternity band with diamonds set all around in 18K white gold.', inStock: true },
    { id: '15', name: 'Classic Gold Band', price: 25000, weight: '6.0g', purity: '22K', isNew: false, description: 'Timeless classic gold band in 22K gold. Perfect as a wedding band or simple statement piece.', inStock: true },
    { id: '16', name: 'Cocktail Ring', price: 185000, weight: '12.5g', purity: '18K', isNew: true, description: 'Glamorous cocktail ring with a stunning centerpiece. Perfect for special occasions.', inStock: true },
    { id: '17', name: 'Men\'s Diamond Ring', price: 145000, weight: '10.0g', purity: '18K', isNew: false, description: 'Bold men\'s ring with diamond accents. Sophisticated and masculine design.', inStock: true },
    { id: '18', name: 'Vintage Style Ring', price: 75000, weight: '7.5g', purity: '22K', isNew: true, description: 'Vintage-inspired ring with art deco details. A unique piece for the discerning collector.', inStock: false },
  ],
  bracelets: [
    { id: '19', name: 'Classic Gold Bangle Set', price: 125000, weight: '35.0g', purity: '22K', isNew: false, description: 'Set of 4 classic gold bangles in 22K gold with intricate filigree work.', inStock: true },
    { id: '20', name: 'Charm Bracelet', price: 55000, weight: '15.2g', purity: '22K', isNew: true, description: 'Delightful charm bracelet in 22K gold featuring various symbolic charms.', inStock: true },
    { id: '21', name: 'Diamond Tennis Bracelet', price: 285000, weight: '18.5g', purity: '18K', isNew: true, description: 'Stunning diamond tennis bracelet with brilliant-cut diamonds in 18K white gold.', inStock: true },
    { id: '22', name: 'Gold Kada Set', price: 165000, weight: '45.0g', purity: '22K', isNew: false, description: 'Traditional gold kada set with intricate patterns. A timeless addition to any collection.', inStock: true },
    { id: '23', name: 'Sleek Chain Bracelet', price: 35000, weight: '10.0g', purity: '18K', isNew: false, description: 'Modern sleek chain bracelet with minimalist design. Perfect for layering or wearing alone.', inStock: true },
    { id: '24', name: 'Antique Bangle Collection', price: 225000, weight: '55.0g', purity: '22K', isNew: true, description: 'Exquisite collection of antique-style bangles with traditional craftsmanship.', inStock: false },
  ],
  'gold-bars': [
    { id: '25', name: '1 Gram Gold Bar', price: 6500, weight: '1g', purity: '24K', isNew: false, description: 'Pure 24K gold bar weighing 1 gram. BIS hallmarked with certificate of authenticity.', inStock: true },
    { id: '26', name: '5 Gram Gold Bar', price: 32000, weight: '5g', purity: '24K', isNew: false, description: 'Pure 24K gold bar weighing 5 grams. Perfect for gifting or investment.', inStock: true },
    { id: '27', name: '10 Gram Gold Bar', price: 63500, weight: '10g', purity: '24K', isNew: true, description: 'Pure 24K gold bar weighing 10 grams. Most popular choice for investors.', inStock: true },
    { id: '28', name: '20 Gram Gold Bar', price: 126500, weight: '20g', purity: '24K', isNew: false, description: 'Pure 24K gold bar weighing 20 grams. Comes with assay certificate.', inStock: true },
    { id: '29', name: '50 Gram Gold Bar', price: 315000, weight: '50g', purity: '24K', isNew: true, description: 'Pure 24K gold bar weighing 50 grams. Premium investment option.', inStock: true },
    { id: '30', name: '100 Gram Gold Bar', price: 628000, weight: '100g', purity: '24K', isNew: false, description: 'Pure 24K gold bar weighing 100 grams. The ultimate gold investment.', inStock: true },
  ],
};

const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First'];
const purityOptions = ['All', '24K', '22K', '18K', '14K'];

const countryConfig = {
  in: { currency: '₹', currencyCode: 'INR' },
  ae: { currency: 'AED ', currencyCode: 'AED' },
  uk: { currency: '£', currencyCode: 'GBP' },
};

export default function CategoryPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const slug = params.slug as string;
  const config = countryConfig[country];
  
  const category = categoryData[slug] || {
    title: slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '),
    description: 'Explore our collection',
    banner: '/banners/default.jpg',
  };
  
  const products = productsByCategory[slug] || [];
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('Featured');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPurity, setSelectedPurity] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 700000]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedToWishlist, setAddedToWishlist] = useState(false);

  const filteredProducts = products.filter((product) => {
    if (selectedPurity !== 'All' && product.purity !== selectedPurity) return false;
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'Price: Low to High':
        return a.price - b.price;
      case 'Price: High to Low':
        return b.price - a.price;
      case 'Newest First':
        return b.isNew ? 1 : -1;
      default:
        return 0;
    }
  });

  const formatPrice = (price: number) => {
    return `${config.currency}${price.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href={`/${country}`} className="text-gray-500 hover:text-gold-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={`/${country}/collections`} className="text-gray-500 hover:text-gold-600">
              Collections
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{category.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-gold-100 to-cream-200 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              {category.title}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {category.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
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
                {sortedProducts.length} products
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
                      max="700000"
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
                    setSelectedPurity('All');
                    setPriceRange([0, 700000]);
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
                {sortedProducts.map((product, index) => (
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
                            {category.title}
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

              {sortedProducts.length === 0 && (
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
                    {category.title}
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
