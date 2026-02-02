'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Shield,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  DollarSign,
} from 'lucide-react';

const returnSteps = [
  {
    step: 1,
    title: 'Initiate Return',
    description: 'Log in to your account and select the item to return',
    icon: Package,
  },
  {
    step: 2,
    title: 'Schedule Pickup',
    description: 'Choose a convenient date and time for pickup',
    icon: Clock,
  },
  {
    step: 3,
    title: 'Secure Handover',
    description: 'Hand over the item in original packaging',
    icon: Truck,
  },
  {
    step: 4,
    title: 'Receive Refund',
    description: 'Refund processed within 5-7 business days',
    icon: CheckCircle,
  },
];

export default function ReturnsPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';

  const countryPolicies = {
    in: { days: 15, processing: '5-7' },
    ae: { days: 14, processing: '5-7' },
    uk: { days: 30, processing: '7-10' },
  };

  const policy = countryPolicies[country];

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
              <RotateCcw className="w-4 h-4" />
              Returns & Refunds
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Easy Returns & Refunds
            </h1>
            <p className="text-gray-600 text-lg">
              We want you to be completely satisfied with your purchase. If you&apos;re not happy,
              we offer hassle-free returns within {policy.days} days.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Policy Highlights */}
      <section className="py-12 bg-white border-b border-cream-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{policy.days} Days</h3>
              <p className="text-gray-600">Return Window</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Free Pickup</h3>
              <p className="text-gray-600">We come to you</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{policy.processing} Days</h3>
              <p className="text-gray-600">Refund Processing</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-12">How Returns Work</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {returnSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="text-center">
                    <div className="w-14 h-14 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    {index < returnSteps.length - 1 && (
                      <div className="hidden md:block absolute top-7 left-[60%] w-full h-0.5 bg-gold-200" />
                    )}
                    <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Return vs Exchange */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Return or Exchange?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-cream-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                    <RotateCcw className="w-6 h-6 text-gold-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Return for Refund</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Full refund to original payment method
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Processed within {policy.processing} business days
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    No deductions for returns in original condition
                  </li>
                </ul>
              </div>

              <div className="bg-gold-50 rounded-2xl p-6 ring-2 ring-gold-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-gold-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Exchange</h3>
                  </div>
                  <span className="px-2 py-1 bg-gold-500 text-white text-xs font-medium rounded">
                    Recommended
                  </span>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Swap for a different size, color, or style
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Priority processing
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Get 10% off your next exchange
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Important Information</h2>
            
            <div className="bg-white rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Eligible for Return</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Unused items with original tags and packaging</li>
                    <li>• Items returned within {policy.days} days of delivery</li>
                    <li>• Items with valid proof of purchase</li>
                    <li>• Defective or damaged items (even without packaging)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Not Eligible for Return</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Custom-made or personalized jewellery</li>
                    <li>• Items resized or altered after purchase</li>
                    <li>• Items showing signs of wear or damage by customer</li>
                    <li>• Sale or clearance items (final sale)</li>
                    <li>• Items returned after {policy.days} days</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  q: 'How do I initiate a return?',
                  a: 'Log in to your account, go to "My Orders", select the order you want to return, and click "Return Item". Follow the prompts to schedule a pickup.',
                },
                {
                  q: 'When will I receive my refund?',
                  a: `Refunds are processed within ${policy.processing} business days after we receive and inspect the returned item. The amount will be credited to your original payment method.`,
                },
                {
                  q: 'Do I need to pay for return shipping?',
                  a: 'No, we offer free pickup for all returns. Our secure courier will collect the item from your doorstep.',
                },
                {
                  q: 'Can I return a custom-made piece?',
                  a: 'Unfortunately, custom-made or personalized jewellery cannot be returned unless there is a manufacturing defect.',
                },
                {
                  q: 'What if my item arrives damaged?',
                  a: 'If you receive a damaged item, please contact us immediately with photos of the damage. We will arrange for a free replacement or full refund.',
                },
              ].map((faq, index) => (
                <details
                  key={index}
                  className="bg-cream-50 rounded-xl p-6 group"
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
          <h3 className="text-2xl font-semibold mb-4">Need to start a return?</h3>
          <p className="text-gray-400 mb-6">Log in to your account to initiate a return request</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${country}/account/orders`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
            >
              My Orders
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/${country}/contact`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-600 hover:border-gray-500 text-white rounded-lg transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
