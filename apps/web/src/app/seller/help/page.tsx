'use client';

import {
  HelpCircle,
  MessageCircle,
  Book,
  Video,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const helpCategories = [
  {
    icon: Book,
    title: 'Getting Started',
    description: 'Learn the basics of selling on GrandGold',
    links: [
      { name: 'How to complete onboarding', href: '#' },
      { name: 'Setting up your store', href: '#' },
      { name: 'Adding your first product', href: '#' },
      { name: 'Understanding commissions', href: '#' },
    ],
  },
  {
    icon: HelpCircle,
    title: 'Products & Inventory',
    description: 'Manage your product listings and stock',
    links: [
      { name: 'Product listing guidelines', href: '#' },
      { name: 'Bulk upload products', href: '#' },
      { name: 'Managing inventory', href: '#' },
      { name: 'Product photography tips', href: '#' },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Orders & Shipping',
    description: 'Handle orders and shipping logistics',
    links: [
      { name: 'Processing orders', href: '#' },
      { name: 'Shipping best practices', href: '#' },
      { name: 'Handling returns', href: '#' },
      { name: 'International shipping', href: '#' },
    ],
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides',
    links: [
      { name: 'Seller dashboard overview', href: '#' },
      { name: 'Product listing walkthrough', href: '#' },
      { name: 'Order management tutorial', href: '#' },
      { name: 'Payout settings guide', href: '#' },
    ],
  },
];

const faqs = [
  {
    question: 'How do I get paid?',
    answer: 'Payments are settled weekly to your registered bank account. You can view your payout history and upcoming payments in the Payouts section.',
  },
  {
    question: 'What are the commission rates?',
    answer: 'Commission rates vary by product category, typically ranging from 5-15%. You can view the detailed commission structure during onboarding or in Settings.',
  },
  {
    question: 'How do I handle a return request?',
    answer: 'Return requests appear in your Orders section. Review the request, approve or reject it, and follow the return shipping instructions provided.',
  },
  {
    question: 'Can I sell internationally?',
    answer: 'Yes! GrandGold supports selling across India, UAE, and UK. You can configure which countries to show your products in the Inventory settings.',
  },
];

export default function SellerHelpPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Help & Support</h1>
        <p className="mt-1 text-gray-500">
          Find answers to common questions or contact our seller support team
        </p>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gold-300 transition-colors">
          <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-gold-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
          <p className="text-sm text-gray-500 mb-4">Chat with our support team</p>
          <button className="text-gold-600 font-medium text-sm flex items-center gap-1 hover:text-gold-700">
            Start Chat <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gold-300 transition-colors">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
          <p className="text-sm text-gray-500 mb-4">Get help via email within 24h</p>
          <a
            href="mailto:sellers@thegrandgold.com"
            className="text-gold-600 font-medium text-sm flex items-center gap-1 hover:text-gold-700"
          >
            sellers@thegrandgold.com <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gold-300 transition-colors">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <Phone className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
          <p className="text-sm text-gray-500 mb-4">Mon-Fri, 9am-6pm IST</p>
          <a
            href="tel:+912212345678"
            className="text-gold-600 font-medium text-sm flex items-center gap-1 hover:text-gold-700"
          >
            +91 22 1234 5678 <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Help Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse Help Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpCategories.map((category) => (
            <div
              key={category.title}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-cream-100 rounded-lg flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {category.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-gold-600 flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="p-6">
              <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-sm text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seller Resources */}
      <div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl p-8 text-white">
        <h2 className="text-xl font-semibold mb-2">Seller Resources</h2>
        <p className="text-gold-100 mb-6">
          Download guides, templates, and resources to help grow your business on GrandGold.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-white text-gold-600 font-medium rounded-lg hover:bg-gold-50 transition-colors">
            Download Seller Guide
          </button>
          <button className="px-6 py-3 bg-gold-400/30 text-white font-medium rounded-lg hover:bg-gold-400/40 transition-colors">
            Product Photo Guidelines
          </button>
        </div>
      </div>
    </div>
  );
}
