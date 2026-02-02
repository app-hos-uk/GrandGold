'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Truck,
  Clock,
  Package,
  Shield,
  Globe,
  Check,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const shippingInfo = {
  in: {
    domestic: {
      standard: { days: '5-7', cost: 'Free on orders above ₹10,000' },
      express: { days: '2-3', cost: '₹500' },
      sameDay: { days: 'Same day', cost: '₹1,000', cities: ['Mumbai', 'Delhi', 'Bangalore'] },
    },
    freeShippingThreshold: 10000,
  },
  ae: {
    domestic: {
      standard: { days: '3-5', cost: 'Free on orders above AED 1,000' },
      express: { days: '1-2', cost: 'AED 50' },
      sameDay: { days: 'Same day', cost: 'AED 100', cities: ['Dubai', 'Abu Dhabi'] },
    },
    freeShippingThreshold: 1000,
  },
  uk: {
    domestic: {
      standard: { days: '3-5', cost: 'Free on orders above £500' },
      express: { days: '1-2', cost: '£15' },
      sameDay: { days: 'Same day', cost: '£30', cities: ['London'] },
    },
    freeShippingThreshold: 500,
  },
};

export default function ShippingPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const info = shippingInfo[country];

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
              <Truck className="w-4 h-4" />
              Shipping Information
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Shipping & Delivery
            </h1>
            <p className="text-gray-600 text-lg">
              We ensure your precious jewellery reaches you safely and securely,
              with full insurance and real-time tracking.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Delivery Options</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Standard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Standard Delivery</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {info.domestic.standard.days} days
                </p>
                <p className="text-sm text-gray-600 mb-4">{info.domestic.standard.cost}</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Full insurance coverage
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Real-time tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Signature required
                  </li>
                </ul>
              </motion.div>

              {/* Express */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 ring-2 ring-gold-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-gold-600" />
                  </div>
                  <span className="px-2 py-1 bg-gold-100 text-gold-700 text-xs font-medium rounded">
                    Popular
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Express Delivery</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {info.domestic.express.days} days
                </p>
                <p className="text-sm text-gray-600 mb-4">{info.domestic.express.cost}</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Priority handling
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Full insurance coverage
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    SMS & email updates
                  </li>
                </ul>
              </motion.div>

              {/* Same Day */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Same Day Delivery</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {info.domestic.sameDay.days}
                </p>
                <p className="text-sm text-gray-600 mb-4">{info.domestic.sameDay.cost}</p>
                <p className="text-xs text-gray-500 mb-4">
                  Available in: {info.domestic.sameDay.cities.join(', ')}
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Order before 12 PM
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    White-glove service
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Fully Insured', desc: 'Complete coverage during transit' },
              { icon: MapPin, title: 'Live Tracking', desc: 'Track your order in real-time' },
              { icon: Package, title: 'Secure Packaging', desc: 'Tamper-proof luxury packaging' },
              { icon: Sparkles, title: 'Gift Ready', desc: 'Elegant gift wrapping available' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-gold-100 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-gold-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  q: 'How is my jewellery shipped?',
                  a: 'All jewellery is shipped in tamper-proof, luxury packaging with full insurance. We use trusted courier partners with specialized handling for valuable items.',
                },
                {
                  q: 'Can I track my order?',
                  a: 'Yes, once your order is shipped, you will receive a tracking number via email and SMS. You can track your order in real-time on our website or the courier partner\'s website.',
                },
                {
                  q: 'What if I am not available for delivery?',
                  a: 'Our courier partner will attempt delivery up to 3 times. You can also reschedule delivery or choose to collect from a nearby pickup point.',
                },
                {
                  q: 'Do you ship internationally?',
                  a: 'Yes, we ship to select countries. International shipping costs and delivery times vary by destination. Contact us for more details.',
                },
                {
                  q: 'Is my jewellery insured during shipping?',
                  a: 'Yes, all orders are fully insured during transit. In the rare event of loss or damage, we will replace or refund your order.',
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
                  <p className="mt-4 text-gray-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-4">Have more questions?</h3>
          <p className="text-gray-400 mb-6">Our customer support team is here to help</p>
          <Link
            href={`/${country}/contact`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
          >
            Contact Us
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
