'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { useWishlist } from '@/contexts/wishlist-context';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Heart,
  ShoppingBag,
  Share2,
  Minus,
  Plus,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Sparkles,
  Star,
  ZoomIn,
  Clock,
  Scan,
} from 'lucide-react';
import { Recommendations } from '@/components/product/recommendations';
import { CompleteTheLook } from '@/components/product/complete-the-look';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: string;
  purity: string;
  description: string;
  features: string[];
  images: string[];
  isNew: boolean;
  inStock: boolean;
  rating: number;
  reviews: number;
  sku: string;
}

const allProducts: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Traditional Kundan Necklace Set',
    category: 'Necklaces',
    price: 185000,
    weight: '45.5g',
    purity: '22K',
    description: 'Exquisite handcrafted Kundan necklace set featuring intricate meenakari work. This stunning piece combines traditional craftsmanship with timeless elegance, perfect for weddings and special occasions. Each stone is carefully set by master artisans using centuries-old techniques passed down through generations.',
    features: [
      'Handcrafted by master artisans',
      'Genuine Kundan stones with meenakari work',
      'Comes with matching earrings',
      'BIS Hallmarked 22K gold',
      'Certificate of authenticity included',
      'Elegant presentation box',
    ],
    images: ['/products/necklace-1.jpg', '/products/necklace-1-2.jpg', '/products/necklace-1-3.jpg'],
    isNew: true,
    inStock: true,
    rating: 4.8,
    reviews: 124,
    sku: 'GG-NK-001',
  },
  '2': {
    id: '2',
    name: 'Diamond Studded Jhumkas',
    category: 'Earrings',
    price: 78500,
    weight: '12.3g',
    purity: '18K',
    description: 'Beautiful diamond-studded jhumkas crafted in 18K gold. These elegant earrings feature sparkling diamonds set in a classic jhumka design, perfect for both traditional and contemporary outfits. The intricate detailing and premium diamonds make these a treasured addition to any jewelry collection.',
    features: [
      'Natural diamonds (VS clarity, G-H color)',
      'Total diamond weight: 0.85 carats',
      '18K gold with rhodium plating',
      'Secure lever-back closure',
      'IGI certified diamonds',
      'Lifetime free polishing',
    ],
    images: ['/products/earring-1.jpg', '/products/earring-1-2.jpg'],
    isNew: false,
    inStock: true,
    rating: 4.9,
    reviews: 89,
    sku: 'GG-ER-002',
  },
  '3': {
    id: '3',
    name: 'Solitaire Engagement Ring',
    category: 'Rings',
    price: 245000,
    weight: '8.2g',
    purity: '18K',
    description: 'Stunning solitaire engagement ring featuring a brilliant-cut diamond set in 18K white gold. The timeless design symbolizes eternal love and commitment. This exquisite ring features a 1-carat center stone with exceptional brilliance and fire.',
    features: [
      '1.0 carat brilliant-cut diamond',
      'GIA certified (Excellent cut)',
      'D-F color, VVS1-VS2 clarity',
      '18K white gold setting',
      'Comfort fit band',
      'Ring sizing available',
    ],
    images: ['/products/ring-1.jpg', '/products/ring-1-2.jpg'],
    isNew: true,
    inStock: true,
    rating: 5.0,
    reviews: 67,
    sku: 'GG-RG-003',
  },
  '4': {
    id: '4',
    name: 'Classic Gold Bangle Set',
    category: 'Bracelets',
    price: 125000,
    weight: '35.0g',
    purity: '22K',
    description: 'Set of 4 classic gold bangles in 22K gold with intricate filigree work. These versatile bangles are perfect for everyday wear or special occasions. The traditional design with modern craftsmanship makes these bangles a timeless addition to your collection.',
    features: [
      'Set of 4 matching bangles',
      '22K pure gold',
      'Intricate filigree patterns',
      'Comfortable rounded edges',
      'BIS Hallmarked',
      'Available in multiple sizes',
    ],
    images: ['/products/bangle-1.jpg', '/products/bangle-1-2.jpg'],
    isNew: false,
    inStock: true,
    rating: 4.7,
    reviews: 156,
    sku: 'GG-BR-004',
  },
  '5': {
    id: '5',
    name: 'Temple Design Choker',
    category: 'Necklaces',
    price: 295000,
    weight: '58.2g',
    purity: '22K',
    description: 'Magnificent temple design choker necklace inspired by ancient South Indian temple architecture. Hand-crafted in 22K gold with divine motifs and intricate detailing. This masterpiece celebrates the rich heritage of Indian craftsmanship.',
    features: [
      'Inspired by temple architecture',
      'Divine motifs and deity designs',
      '22K pure gold construction',
      'Adjustable back chain',
      'Matching earrings available',
      'Comes with authenticity certificate',
    ],
    images: ['/products/necklace-2.jpg', '/products/necklace-2-2.jpg'],
    isNew: true,
    inStock: false,
    rating: 4.9,
    reviews: 43,
    sku: 'GG-NK-005',
  },
  '6': {
    id: '6',
    name: 'Pearl Drop Earrings',
    category: 'Earrings',
    price: 45000,
    weight: '8.5g',
    purity: '18K',
    description: 'Elegant pearl drop earrings featuring lustrous freshwater pearls set in 18K gold. A timeless accessory that adds sophistication to any ensemble. Perfect for office wear or evening occasions.',
    features: [
      'AAA grade freshwater pearls',
      '18K yellow gold setting',
      'Secure post and butterfly back',
      'Pearl size: 8-9mm',
      'Hypoallergenic',
      'Perfect for sensitive ears',
    ],
    images: ['/products/earring-2.jpg'],
    isNew: false,
    inStock: true,
    rating: 4.6,
    reviews: 78,
    sku: 'GG-ER-006',
  },
  '7': {
    id: '7',
    name: 'Diamond Eternity Band',
    category: 'Rings',
    price: 165000,
    weight: '5.8g',
    purity: '18K',
    description: 'Exquisite diamond eternity band featuring brilliant-cut diamonds set all around in 18K white gold. Perfect as a wedding band or anniversary gift. The continuous circle of diamonds symbolizes never-ending love.',
    features: [
      '2.5 carats total diamond weight',
      'Brilliant-cut diamonds',
      '18K white gold',
      'Shared prong setting',
      'IGI certified',
      'Comfort fit design',
    ],
    images: ['/products/ring-2.jpg'],
    isNew: false,
    inStock: true,
    rating: 4.8,
    reviews: 92,
    sku: 'GG-RG-007',
  },
  '8': {
    id: '8',
    name: 'Charm Bracelet',
    category: 'Bracelets',
    price: 55000,
    weight: '15.2g',
    purity: '22K',
    description: 'Delightful charm bracelet in 22K gold featuring various symbolic charms. Each charm tells a story, making this bracelet a meaningful gift or personal treasure. Add more charms over time to create your unique story.',
    features: [
      '5 beautiful gold charms included',
      'Expandable chain design',
      '22K pure gold',
      'Secure lobster clasp',
      'Additional charms available',
      'Adjustable length',
    ],
    images: ['/products/bracelet-1.jpg'],
    isNew: true,
    inStock: true,
    rating: 4.5,
    reviews: 34,
    sku: 'GG-BR-008',
  },
};

const countryConfig = {
  in: { currency: '₹', country: 'IN' as const },
  ae: { currency: 'AED ', country: 'AE' as const },
  uk: { currency: '£', country: 'UK' as const },
};

export default function ProductPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const productId = params.id as string;
  const config = countryConfig[country];
  const { addItem: addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const product = allProducts[productId];
  const inWishlist = isInWishlist(productId);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'features' | 'shipping'>('description');

  const handleAddToCart = async () => {
    if (!product?.inStock) return;
    setAddingToCart(true);
    try {
      await addToCart(productId, quantity, config.country);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {
      // Add to cart failed - cart context handles state
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (inWishlist) {
        await removeFromWishlist(productId, config.country);
      } else {
        await addToWishlist(productId, config.country);
      }
    } catch {
      // Wishlist toggle failed - silently ignore
    }
  };

  const formatPrice = (price: number) => {
    return `${config.currency}${price.toLocaleString()}`;
  };

  if (!product) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href={`/${country}/collections`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      </main>
    );
  }

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
            <Link 
              href={`/${country}/category/${product.category.toLowerCase()}`} 
              className="text-gray-500 hover:text-gold-600"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div>
              <div className="relative bg-gradient-to-br from-cream-100 to-cream-200 rounded-2xl aspect-square flex items-center justify-center mb-4 overflow-hidden group">
                <Sparkles className="w-32 h-32 text-gold-300" />
                
                {product.isNew && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-gold-500 text-white text-sm font-medium rounded-full">
                    NEW
                  </span>
                )}
                
                {!product.inStock && (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                    Out of Stock
                  </span>
                )}

                <button className="absolute bottom-4 right-4 p-3 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-3">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg bg-gradient-to-br from-cream-100 to-cream-200 flex items-center justify-center transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-gold-500'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Sparkles className="w-8 h-8 text-gold-300" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <span className="text-sm text-gold-600 font-medium">{product.category}</span>
              <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 mt-2">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'text-gold-500 fill-gold-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{product.reviews} reviews</span>
              </div>

              {/* Price */}
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Product Meta */}
              <div className="flex flex-wrap gap-4 mt-6 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-cream-100 rounded-lg">
                  <span className="text-gray-600">Purity:</span>
                  <span className="font-semibold">{product.purity}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-cream-100 rounded-lg">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-semibold">{product.weight}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-cream-100 rounded-lg">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-semibold">{product.sku}</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mt-6">
                {product.inStock ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">In Stock - Ready to Ship</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Out of Stock - Notify Me</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center font-semibold text-xl">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || addingToCart}
                  className={`flex-1 py-4 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-lg ${
                    addedToCart
                      ? 'bg-green-500 text-white'
                      : product.inStock
                      ? 'bg-gold-500 hover:bg-gold-600 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {addingToCart ? (
                    <span className="animate-pulse">Adding...</span>
                  ) : addedToCart ? (
                    <>
                      <Check className="w-6 h-6" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-6 h-6" />
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </>
                  )}
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all ${
                    inWishlist
                      ? 'bg-red-50 text-red-500 border-2 border-red-500'
                      : 'border-2 border-gray-200 text-gray-500 hover:border-gold-500 hover:text-gold-500'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${inWishlist ? 'fill-red-500' : ''}`} />
                </button>
                <button className="w-14 h-14 flex items-center justify-center border-2 border-gray-200 text-gray-500 hover:border-gold-500 hover:text-gold-500 rounded-xl transition-all">
                  <Share2 className="w-6 h-6" />
                </button>
                {(product.category === 'Necklaces' || product.category === 'Earrings' || product.category === 'Rings') && (
                  <Link
                    href={`/${country}/ar-tryon?product=${product.id}`}
                    className="flex items-center gap-2 px-4 py-3 border-2 border-gold-500 text-gold-600 hover:bg-gold-50 rounded-xl transition-colors"
                  >
                    <Scan className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">Try in AR</span>
                  </Link>
                )}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-cream-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Truck className="w-6 h-6 text-gold-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                  <p className="text-xs text-gray-500">On orders above {formatPrice(10000)}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-gold-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">BIS Hallmarked</p>
                  <p className="text-xs text-gray-500">100% Certified</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <RotateCcw className="w-6 h-6 text-gold-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                  <p className="text-xs text-gray-500">15-day policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Tabs */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Tab Headers */}
            <div className="flex border-b border-cream-200">
              {[
                { id: 'description', label: 'Description' },
                { id: 'features', label: 'Features' },
                { id: 'shipping', label: 'Shipping & Returns' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-4 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-gold-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="py-8">
              {activeTab === 'description' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </motion.div>
              )}

              {activeTab === 'features' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ul className="space-y-4">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 text-gold-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {activeTab === 'shipping' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-gold-500" />
                      Shipping Information
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Free shipping on orders above {formatPrice(10000)}</li>
                      <li>• Standard delivery: 5-7 business days</li>
                      <li>• Express delivery: 2-3 business days</li>
                      <li>• Same-day delivery available in select cities</li>
                      <li>• All orders are fully insured during transit</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-gold-500" />
                      Return Policy
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• 15-day easy returns on all orders</li>
                      <li>• Free pickup from your doorstep</li>
                      <li>• Full refund within 5-7 business days</li>
                      <li>• Exchange available for different sizes</li>
                      <li>• Custom-made items are non-returnable</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-12 bg-cream-50">
        <div className="container mx-auto px-4 space-y-16">
          <Recommendations
            country={country}
            currentProductId={product.id}
            currentCategory={product.category}
            products={Object.values(allProducts).map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
            }))}
          />
          <CompleteTheLook
            country={country}
            currentProduct={{
              id: product.id,
              name: product.name,
              category: product.category,
              price: product.price,
            }}
            suggestions={Object.values(allProducts).map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
            }))}
          />
        </div>
      </section>
    </main>
  );
}
