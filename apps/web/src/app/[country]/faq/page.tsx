'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  HelpCircle,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  Shield,
  Sparkles,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';

const faqCategories = [
  { id: 'ordering', label: 'Ordering', icon: Package },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'products', label: 'Products', icon: Sparkles },
  { id: 'account', label: 'Account', icon: Shield },
];

const faqs = {
  ordering: [
    {
      q: 'How do I place an order?',
      a: 'Simply browse our collections, select the items you like, add them to your cart, and proceed to checkout. You can pay using various payment methods and your order will be confirmed instantly.',
    },
    {
      q: 'Can I modify or cancel my order?',
      a: 'You can modify or cancel your order within 2 hours of placing it. After that, the order enters our processing system. Contact our customer support for assistance.',
    },
    {
      q: 'How do I track my order?',
      a: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can also track your order by logging into your account and visiting the "My Orders" section.',
    },
    {
      q: 'Is my order information secure?',
      a: 'Yes, we use industry-standard SSL encryption to protect all your personal and payment information. We never store your complete credit card details.',
    },
  ],
  shipping: [
    {
      q: 'How long does delivery take?',
      a: 'Standard delivery takes 5-7 business days, express delivery takes 2-3 days, and same-day delivery is available in select cities for orders placed before 12 PM.',
    },
    {
      q: 'Is shipping free?',
      a: 'Yes, we offer free shipping on orders above a certain amount (varies by country). For orders below the threshold, a nominal shipping fee applies.',
    },
    {
      q: 'Do you ship internationally?',
      a: 'Yes, we ship to select countries internationally. Shipping costs and delivery times vary by destination. Please contact us for specific details.',
    },
    {
      q: 'How is my jewellery packaged?',
      a: 'All items are shipped in elegant, tamper-proof packaging suitable for gifting. Each piece is secured to prevent damage during transit.',
    },
  ],
  returns: [
    {
      q: 'What is your return policy?',
      a: 'We offer hassle-free returns within 15 days (India), 14 days (UAE), or 30 days (UK) of delivery. Items must be in original, unworn condition with all tags attached.',
    },
    {
      q: 'How do I return an item?',
      a: 'Log in to your account, go to "My Orders", select the item you wish to return, and follow the prompts. We will schedule a free pickup from your address.',
    },
    {
      q: 'When will I receive my refund?',
      a: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method.',
    },
    {
      q: 'Can I exchange instead of return?',
      a: 'Yes! You can exchange for a different size, color, or even a different item. Exchanges are processed faster and you get a 10% discount on your next exchange.',
    },
  ],
  payments: [
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit/debit cards, UPI, net banking, EMI options, and various digital wallets. Payment methods vary by country.',
    },
    {
      q: 'Is EMI available?',
      a: 'Yes, we offer no-cost EMI on orders above a certain amount with select bank cards. EMI options are displayed at checkout.',
    },
    {
      q: 'Is it safe to use my credit card?',
      a: 'Absolutely. Our website uses 256-bit SSL encryption and we are PCI-DSS compliant. We do not store your complete card details.',
    },
    {
      q: 'Can I pay cash on delivery?',
      a: 'Cash on delivery is not available for jewellery orders due to the high value of items. We recommend using secure online payment methods.',
    },
  ],
  products: [
    {
      q: 'How do I verify gold purity?',
      a: 'All our gold jewellery comes with BIS hallmark certification (India), Dubai assay mark (UAE), or UK Assay Office stamp. You can verify the hallmark on official government websites.',
    },
    {
      q: 'What is the difference between 22K and 24K gold?',
      a: '24K is pure gold (99.9%), while 22K contains 91.6% gold mixed with other metals for durability. 22K is preferred for jewellery as it is more durable.',
    },
    {
      q: 'Are diamonds certified?',
      a: 'Yes, all diamonds above 0.30 carats come with international certification from GIA, IGI, or HRD. The certification details are mentioned in the product description.',
    },
    {
      q: 'How do I care for my jewellery?',
      a: 'Store in individual pouches, avoid contact with perfumes and chemicals, clean gently with a soft cloth, and get professional cleaning once a year.',
    },
  ],
  account: [
    {
      q: 'How do I create an account?',
      a: 'Click on "Account" in the header and select "Sign Up". You can register with your email or phone number, or use Google/Apple sign-in.',
    },
    {
      q: 'I forgot my password. What do I do?',
      a: 'Click on "Forgot Password" on the login page and enter your email. We will send you a link to reset your password.',
    },
    {
      q: 'How do I update my profile?',
      a: 'Log in to your account, go to "Settings", and update your personal information, addresses, and notification preferences.',
    },
    {
      q: 'Is my personal data safe?',
      a: 'Yes, we take data privacy seriously. We use encryption, never share your data with third parties, and comply with all data protection regulations.',
    },
  ],
};

export default function FAQPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ordering');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentFaqs = faqs[activeCategory as keyof typeof faqs] || [];

  const filteredFaqs = searchQuery
    ? Object.values(faqs)
        .flat()
        .filter(
          (faq) =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : currentFaqs;

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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 rounded-full text-gold-700 text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-600 mb-8">
              Find answers to common questions about orders, shipping, returns, and more.
            </p>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-cream-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Category Tabs */}
            {!searchQuery && (
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {faqCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setOpenFaq(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === category.id
                        ? 'bg-gold-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-cream-100'
                    }`}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.label}
                  </button>
                ))}
              </div>
            )}

            {/* FAQ List */}
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-6 pb-6"
                    >
                      <p className="text-gray-600">{faq.a}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try different keywords or browse by category
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <MessageCircle className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-4">Still have questions?</h3>
            <p className="text-gray-400 mb-6">
              Our customer support team is here to help you with any questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${country}/contact`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href={`/${country}/help`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-600 hover:border-gray-500 text-white rounded-lg transition-colors"
              >
                Visit Help Center
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
