'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, TrendingUp } from 'lucide-react';
import { TrendingProducts } from '@/components/home/trending-products';
import { PersonalizedSection } from '@/components/home/personalized-section';

const mockProducts = [
  { id: '1', name: 'Traditional Kundan Necklace Set', category: 'Necklaces', price: 185000 },
  { id: '2', name: 'Diamond Jhumkas', category: 'Earrings', price: 78500 },
  { id: '3', name: 'Solitaire Ring', category: 'Rings', price: 245000 },
  { id: '4', name: 'Pearl Drop Earrings', category: 'Earrings', price: 45000 },
  { id: '5', name: 'Temple Choker', category: 'Necklaces', price: 295000 },
  { id: '6', name: 'Diamond Eternity Band', category: 'Rings', price: 165000 },
];

// Country-specific content
const countryContent = {
  in: {
    currency: '₹',
    heroTitle: 'Discover Exquisite Gold Jewellery',
    heroSubtitle: 'From India\'s finest craftsmen',
    cta: 'Explore Collection',
    features: [
      { icon: Shield, title: 'BIS Hallmarked', desc: 'Every piece certified' },
      { icon: TrendingUp, title: 'Live Gold Rates', desc: 'Updated every minute' },
      { icon: Sparkles, title: 'AR Try-On', desc: 'Virtual jewellery experience' },
    ],
  },
  ae: {
    currency: 'AED',
    heroTitle: 'Discover Exquisite Gold Jewellery',
    heroSubtitle: 'From the heart of the Gold Souk',
    cta: 'Explore Collection',
    features: [
      { icon: Shield, title: 'UAE Certified', desc: 'Government approved' },
      { icon: TrendingUp, title: 'Live Gold Rates', desc: 'Updated every minute' },
      { icon: Sparkles, title: 'AR Try-On', desc: 'Virtual jewellery experience' },
    ],
  },
  uk: {
    currency: '£',
    heroTitle: 'Discover Exquisite Gold Jewellery',
    heroSubtitle: 'Luxury craftsmanship delivered to your door',
    cta: 'Explore Collection',
    features: [
      { icon: Shield, title: 'Hallmarked', desc: 'Assay office certified' },
      { icon: TrendingUp, title: 'Live Gold Rates', desc: 'Updated every minute' },
      { icon: Sparkles, title: 'AR Try-On', desc: 'Virtual jewellery experience' },
    ],
  },
};

export default function HomePage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const content = countryContent[country] || countryContent.in;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-luxury">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('/patterns/gold-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold-500/10 to-transparent" />
        
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 rounded-full text-gold-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Premium Collection 2025
              </span>
              
              <h1 className="font-display text-5xl lg:text-7xl font-semibold text-gray-900 mb-6 leading-tight">
                {content.heroTitle}
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                {content.heroSubtitle}. Experience the finest selection of gold and diamond jewellery with live pricing and virtual try-on.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href={`/${country}/collections`}
                  className="btn-luxury inline-flex items-center justify-center gap-2"
                >
                  {content.cta}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                
                <Link
                  href={`/${country}/ar-tryon`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 font-medium text-gold-700 bg-white border-2 border-gold-500 rounded-lg hover:bg-gold-50 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Try AR Experience
                </Link>
              </div>
            </motion.div>
            
            {/* Right - Hero image placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square max-w-lg mx-auto bg-gradient-to-br from-gold-100 to-cream-200 rounded-full flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gradient-gold rounded-full flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-white" />
                  </div>
                  <p className="text-gold-700 font-serif text-lg">
                    Premium Jewellery
                  </p>
                </div>
              </div>
              
              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-10 right-10 bg-white rounded-xl shadow-luxury p-4"
              >
                <div className="text-sm text-gray-500">Gold Rate</div>
                <div className="text-xl font-bold text-gold-600">{content.currency}6,150/g</div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                className="absolute bottom-10 left-10 bg-white rounded-xl shadow-luxury p-4"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-medium">100% Certified</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {content.features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-luxury p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gold-100 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-gold-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Gold Price Ticker */}
      <section className="py-8 bg-gray-900 text-white overflow-hidden">
        <div className="flex animate-marquee gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 whitespace-nowrap">
              <span className="flex items-center gap-2">
                <span className="text-gold-400">24K Gold:</span>
                <span className="font-bold">{content.currency}6,150/g</span>
                <span className="text-green-400 text-sm">+0.5%</span>
              </span>
              <span className="text-gray-500">|</span>
              <span className="flex items-center gap-2">
                <span className="text-gold-400">22K Gold:</span>
                <span className="font-bold">{content.currency}5,638/g</span>
                <span className="text-green-400 text-sm">+0.4%</span>
              </span>
              <span className="text-gray-500">|</span>
              <span className="flex items-center gap-2">
                <span className="text-gold-400">18K Gold:</span>
                <span className="font-bold">{content.currency}4,613/g</span>
                <span className="text-red-400 text-sm">-0.2%</span>
              </span>
              <span className="text-gray-500">|</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trending & Personalized */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <TrendingProducts country={country} products={mockProducts} />
        </div>
      </section>
      <section className="py-8">
        <div className="container mx-auto px-4">
          <PersonalizedSection country={country} products={mockProducts} />
        </div>
      </section>

      {/* Collections Preview */}
      <section className="py-20 bg-cream-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-semibold mb-4">
              Curated Collections
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our handpicked collections featuring the finest craftsmanship
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {['Traditional Bridal', 'Contemporary', 'Everyday Elegance'].map((collection, i) => (
              <motion.div
                key={collection}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="aspect-[4/5] bg-gradient-to-br from-gold-100 to-cream-200 rounded-2xl mb-4 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white font-medium flex items-center gap-2">
                      View Collection <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold">{collection}</h3>
                <p className="text-gray-600">Starting from {content.currency}15,000</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
