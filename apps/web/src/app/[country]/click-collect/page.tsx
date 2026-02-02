'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { clickCollectApi } from '@/lib/api';
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  Search,
  Check,
  ChevronRight,
  Store,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';

interface StoreLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat?: number;
  lng?: number;
  distance?: string;
  available?: boolean;
}

const FALLBACK_STORES: Record<string, StoreLocation[]> = {
  in: [
    { id: '1', name: 'GrandGold Mumbai - Bandra', address: 'Linking Road, Bandra West, Mumbai 400050', phone: '+91 22 1234 5678', hours: '10:00 AM - 9:00 PM', distance: '2.5 km', available: true },
    { id: '2', name: 'GrandGold Mumbai - Andheri', address: 'Infiniti Mall, Andheri West, Mumbai 400053', phone: '+91 22 1234 5679', hours: '10:00 AM - 10:00 PM', distance: '5.8 km', available: true },
  ],
  ae: [{ id: '1', name: 'GrandGold Dubai - Gold Souk', address: 'Deira Gold Souk, Dubai', phone: '+971 4 123 4567', hours: '10:00 AM - 10:00 PM', distance: '3.2 km', available: true }],
  uk: [{ id: '1', name: 'GrandGold London - Mayfair', address: '123 Bond Street, Mayfair, London W1S', phone: '+44 20 1234 5678', hours: '10:00 AM - 7:00 PM', distance: '1.2 km', available: true }],
};

const steps = [
  {
    icon: ShoppingBag,
    title: 'Shop Online',
    description: 'Browse our collection and add items to your cart',
  },
  {
    icon: Store,
    title: 'Select Store',
    description: 'Choose your preferred store for collection',
  },
  {
    icon: CreditCard,
    title: 'Pay Online',
    description: 'Complete your purchase securely online',
  },
  {
    icon: Check,
    title: 'Collect In-Store',
    description: 'Pick up your order within 2 hours of confirmation',
  },
];

export default function ClickCollectPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    clickCollectApi
      .getStores(country.toUpperCase())
      .then((res) => {
        const d = res as { data?: StoreLocation[] };
        setStores(Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => setStores(FALLBACK_STORES[country] ?? FALLBACK_STORES.in))
      .finally(() => setLoading(false));
  }, [country]);

  const countryStores = stores.length > 0 ? stores : (FALLBACK_STORES[country] ?? FALLBACK_STORES.in);

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <section className="bg-gradient-luxury py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 rounded-full text-gold-700 text-sm font-medium mb-6">
              <Store className="w-4 h-4" />
              Click & Collect
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Shop Online, Collect In-Store
            </h1>
            <p className="text-gray-600 text-lg">
              Order online and collect your jewellery from your nearest store within 2 hours.
              Free of charge with no minimum order value.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-white border-b border-cream-200">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gold-100 rounded-2xl flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-gold-600" />
                </div>
                <div className="absolute top-8 left-[60%] w-[80%] h-0.5 bg-gold-200 hidden md:block last:hidden" />
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Store Finder */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Find Your Nearest Store</h2>
            
            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by city, area or pincode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-lg"
              />
            </div>

            {/* Store List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading stores...</div>
              ) : (
              countryStores.map((store) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                    selectedStore === store.id
                      ? 'ring-2 ring-gold-500 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedStore(store.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{store.name}</h3>
                        {store.available && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Available for pickup
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{store.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{store.hours}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{store.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{store.distance}</p>
                      <button className="mt-3 flex items-center gap-1 text-gold-600 text-sm font-medium hover:text-gold-700">
                        <Navigation className="w-4 h-4" />
                        Directions
                      </button>
                    </div>
                  </div>
                  
                  {selectedStore === store.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-cream-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="w-5 h-5" />
                          <span className="font-medium">Selected for pickup</span>
                        </div>
                        <Link
                          href={`/${country}/collections`}
                          className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
                        >
                          Start Shopping
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-gold-400 mb-2">Free</h3>
              <p className="text-gray-400">No collection fee, ever</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gold-400 mb-2">2 Hours</h3>
              <p className="text-gray-400">Ready for collection</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gold-400 mb-2">7 Days</h3>
              <p className="text-gray-400">To collect your order</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {[
                {
                  q: 'How long do I have to collect my order?',
                  a: 'You have 7 days from the date of order confirmation to collect your purchase from the selected store.',
                },
                {
                  q: 'Can someone else collect my order?',
                  a: 'Yes, you can authorize someone else to collect your order. They will need to present the order confirmation and valid ID.',
                },
                {
                  q: 'What if the item is not available at my chosen store?',
                  a: 'We will transfer the item from another location. You will be notified once it is ready for collection.',
                },
                {
                  q: 'Can I return or exchange in-store?',
                  a: 'Yes, you can return or exchange your Click & Collect orders at any of our stores within our return policy period.',
                },
              ].map((faq, index) => (
                <details
                  key={index}
                  className="bg-white rounded-xl p-6 group"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="font-medium text-gray-900">{faq.q}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-4 text-gray-600 text-sm">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
