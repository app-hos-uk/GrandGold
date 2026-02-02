'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';

const categories = [
  {
    icon: Package,
    title: 'Orders & Tracking',
    description: 'Track orders, cancellations, and modifications',
    href: '/help/orders',
    articles: 12,
  },
  {
    icon: Truck,
    title: 'Shipping & Delivery',
    description: 'Delivery times, shipping costs, and locations',
    href: '/help/shipping',
    articles: 8,
  },
  {
    icon: RotateCcw,
    title: 'Returns & Refunds',
    description: 'Return policy, refund process, and exchanges',
    href: '/help/returns',
    articles: 10,
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Payment methods, security, and billing',
    href: '/help/payments',
    articles: 7,
  },
  {
    icon: Sparkles,
    title: 'Product Information',
    description: 'Gold purity, diamonds, certifications',
    href: '/help/products',
    articles: 15,
  },
  {
    icon: Shield,
    title: 'Account & Security',
    description: 'Password, login issues, account settings',
    href: '/help/account',
    articles: 9,
  },
];

const popularArticles = [
  { title: 'How to track my order?', href: '/help/track-order' },
  { title: 'What is your return policy?', href: '/help/return-policy' },
  { title: 'How do I verify gold purity?', href: '/help/gold-purity' },
  { title: 'What payment methods do you accept?', href: '/help/payment-methods' },
  { title: 'How long does delivery take?', href: '/help/delivery-time' },
  { title: 'How to use AR Try-On?', href: '/help/ar-tryon' },
];

export default function HelpPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <section className="bg-gradient-luxury py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              How can we help you?
            </h1>
            <p className="text-gray-600 mb-8">
              Search our help center or browse categories below
            </p>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-cream-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-8">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/${country}${category.href}`}
                  className="block bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center group-hover:bg-gold-200 transition-colors">
                      <category.icon className="w-6 h-6 text-gold-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{category.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                      <span className="text-xs text-gold-600">{category.articles} articles</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gold-500 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Popular Articles</h2>
            <div className="space-y-3">
              {popularArticles.map((article, index) => (
                <motion.div
                  key={article.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/${country}${article.href}`}
                    className="flex items-center justify-between p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-gold-500" />
                      <span className="font-medium text-gray-900">{article.title}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gold-500 transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-8">Still need help?</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              href={`/${country}/contact`}
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-3">Chat with our support team</p>
              <span className="text-xs text-green-600 flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Available now
              </span>
            </Link>

            <a
              href="tel:+911234567890"
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-sm text-gray-600 mb-3">Mon-Sat, 10am - 7pm</p>
              <span className="text-sm text-gold-600 font-medium">+91 123 456 7890</span>
            </a>

            <a
              href="mailto:support@thegrandgold.com"
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-sm text-gray-600 mb-3">We reply within 24 hours</p>
              <span className="text-sm text-gold-600 font-medium">support@thegrandgold.com</span>
            </a>
          </div>
        </div>
      </section>

      {/* Operating Hours */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Clock className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4">Customer Support Hours</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 mb-1">Monday - Saturday</p>
                <p className="font-medium">10:00 AM - 7:00 PM</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 mb-1">Sunday</p>
                <p className="font-medium">Closed</p>
              </div>
            </div>
            <p className="text-gray-400 mt-4 text-sm">
              All times are in local timezone
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
