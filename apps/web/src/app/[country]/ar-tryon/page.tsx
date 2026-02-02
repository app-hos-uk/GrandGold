'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera,
  Upload,
  Sparkles,
  RotateCcw,
  Download,
  Share2,
  ChevronLeft,
  Heart,
  ShoppingBag,
  Play,
  X,
} from 'lucide-react';
import type { ARAdjustment } from '@/components/product/ar-face-tryon';

const ARCameraView = dynamic(() => import('@/components/product/ar-camera-view').then((m) => ({ default: m.ARCameraView })), { ssr: false });
const ARAdjustmentControls = dynamic(() => import('@/components/product/ar-adjustment-controls').then((m) => ({ default: m.ARAdjustmentControls })), { ssr: false });

const sampleProducts = [
  { id: '1', name: 'Traditional Kundan Necklace', category: 'Necklaces', price: 185000 },
  { id: '2', name: 'Diamond Jhumkas', category: 'Earrings', price: 78500 },
  { id: '3', name: 'Temple Choker Set', category: 'Necklaces', price: 295000 },
  { id: '4', name: 'Pearl Drop Earrings', category: 'Earrings', price: 45000 },
  { id: '5', name: 'Gold Chandbalis', category: 'Earrings', price: 95000 },
  { id: '6', name: 'Layered Gold Chain', category: 'Necklaces', price: 65000 },
  { id: '7', name: 'Solitaire Ring', category: 'Rings', price: 245000 },
  { id: '8', name: 'Diamond Eternity Band', category: 'Rings', price: 165000 },
];

const countryConfig = {
  in: { currency: '₹' },
  ae: { currency: 'AED ' },
  uk: { currency: '£' },
};

function ARTryOnContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const config = countryConfig[country];

  const productIdFromUrl = searchParams.get('product');
  const initialProduct = productIdFromUrl
    ? sampleProducts.find((p) => p.id === productIdFromUrl) ?? sampleProducts[0]
    : sampleProducts[0];

  const [selectedProduct, setSelectedProduct] = useState(initialProduct);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [adjustment, setAdjustment] = useState<ARAdjustment>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  const handleShare = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    try {
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'ar-tryon.png', { type: 'image/png' });
        await navigator.share({
          title: `My ${selectedProduct.name} try-on - GrandGold`,
          text: 'Check out how this looks on me!',
          files: [file],
        });
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`My ${selectedProduct.name} try-on! ${typeof window !== 'undefined' ? window.location.href : ''}`)}`,
          '_blank'
        );
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        window.open('https://www.instagram.com/', '_blank');
      }
    }
  };
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filteredProducts =
    categoryFilter === 'All'
      ? sampleProducts
      : sampleProducts.filter((p) => p.category === categoryFilter);

  const productCategory =
    selectedProduct.category === 'Earrings'
      ? 'earrings'
      : selectedProduct.category === 'Rings'
        ? 'ring'
        : 'necklace';

  const formatPrice = (price: number) => {
    return `${config.currency}${price.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${country}/collections`}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                  AR Try-On Experience
                </h1>
                <p className="text-sm text-gray-400">Try jewellery virtually before you buy</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowHowItWorks(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gold-400 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              How it works
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Camera/Preview Area */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/3] bg-gray-800 rounded-2xl overflow-hidden">
              {isCameraActive ? (
                <>
                  <ARCameraView
                    productCategory={comparisonMode ? 'earrings' : productCategory}
                    comparisonMode={comparisonMode}
                    adjustment={adjustment}
                    onPermissionDenied={() => setIsCameraActive(false)}
                    onStop={() => setIsCameraActive(false)}
                  />
                  {/* Face/Hand Guide Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {productCategory === 'ring' ? (
                      <div className="w-48 h-48 border-2 border-dashed border-gold-400/50 rounded-full flex items-center justify-center text-gold-400/70 text-sm">
                        Show hand
                      </div>
                    ) : (
                      <div className="w-64 h-80 border-2 border-dashed border-gold-400/50 rounded-full" />
                    )}
                  </div>
                  {/* Selected Jewellery Preview */}
                  <div className="absolute bottom-16 left-4 right-4 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-cream-200 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-gold-500" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedProduct.name}</p>
                        <p className="text-gold-400 text-sm">{formatPrice(selectedProduct.price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                        <Heart className="w-5 h-5 text-white" />
                      </button>
                      <Link
                        href={`/${country}/cart`}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </Link>
                    </div>
                  </div>
                  {/* Camera Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {(productCategory === 'earrings' || productCategory === 'necklace') && (
                      <button
                        onClick={() => setComparisonMode((m) => !m)}
                        className={`p-3 rounded-lg transition-colors ${
                          comparisonMode ? 'bg-gold-500' : 'bg-black/50 hover:bg-black/70'
                        }`}
                        title="Compare mode"
                      >
                        <span className="text-white text-xs">Compare</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const canvas = document.querySelector('canvas');
                        if (canvas) {
                          const data = canvas.toDataURL('image/png');
                          const link = document.createElement('a');
                          link.download = `ar-tryon-${selectedProduct.name.replace(/\s+/g, '-')}.png`;
                          link.href = data;
                          link.click();
                        }
                      }}
                      className="p-3 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
                      title="Share to WhatsApp/Instagram"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {/* Adjustment Controls */}
                  <div className="absolute top-4 left-4">
                    <ARAdjustmentControls
                      adjustment={adjustment}
                      onChange={setAdjustment}
                      category={productCategory === 'ring' ? 'ring' : productCategory}
                    />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md mx-auto p-8"
                  >
                    <div className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-4">
                      Virtual Try-On
                    </h2>
                    <p className="text-gray-400 mb-8">
                      See how our jewellery looks on you in real-time using AR technology.
                      Choose to use your camera or upload a photo.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => setIsCameraActive(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
                      >
                        <Camera className="w-5 h-5" />
                        Use Camera
                      </button>
                      <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
                        <Upload className="w-5 h-5" />
                        Upload Photo
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Action Buttons - Stop is inside ARCameraView; Capture available when active */}
            {isCameraActive && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      const link = document.createElement('a');
                      link.download = `ar-tryon-${selectedProduct.name.replace(/\s+/g, '-')}.png`;
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    }
                  }}
                  className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Capture Photo
                </button>
              </div>
            )}
          </div>

          {/* Product Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Jewellery</h3>
              
              {/* Category Tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {['All', 'Necklaces', 'Earrings', 'Rings'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      categoryFilter === cat
                        ? 'bg-gold-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              {/* Product List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedProduct.id === product.id
                        ? 'bg-gold-500/20 border border-gold-500'
                        : 'bg-gray-700 hover:bg-gray-600 border border-transparent'
                    }`}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-gold-100 to-cream-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-7 h-7 text-gold-500" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{product.name}</p>
                      <p className="text-sm text-gray-400">{product.category}</p>
                      <p className="text-gold-400 font-medium">{formatPrice(product.price)}</p>
                    </div>
                    {selectedProduct.id === product.id && (
                      <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* View Full Catalog */}
              <Link
                href={`/${country}/collections`}
                className="block w-full text-center mt-4 py-3 text-gold-400 hover:bg-gray-700 rounded-lg transition-colors"
              >
                View Full Catalog
              </Link>
            </div>
            
            {/* Tips Card */}
            <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-2xl p-6 mt-6 border border-gold-500/20">
              <h4 className="font-medium text-white mb-3">Tips for best results</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full mt-2 flex-shrink-0" />
                  Ensure good lighting on your face
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full mt-2 flex-shrink-0" />
                  Keep your face centered in the frame
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full mt-2 flex-shrink-0" />
                  Move slowly for better tracking
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full mt-2 flex-shrink-0" />
                  Tie back hair for necklace try-ons
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowHowItWorks(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">How AR Try-On Works</h3>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Enable Camera',
                  description: 'Allow camera access or upload a clear photo of yourself.',
                },
                {
                  step: 2,
                  title: 'Select Jewellery',
                  description: 'Browse and select the jewellery pieces you want to try.',
                },
                {
                  step: 3,
                  title: 'Try Virtually',
                  description: 'See how the jewellery looks on you in real-time with AR.',
                },
                {
                  step: 4,
                  title: 'Save & Share',
                  description: 'Capture photos and share with friends for their opinion.',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowHowItWorks(false);
                setIsCameraActive(true);
              }}
              className="w-full mt-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
            >
              Start Try-On
            </button>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}

export default function ARTryOnPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading AR Try-On...</div>
      </main>
    }>
      <ARTryOnContent />
    </Suspense>
  );
}
