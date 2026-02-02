'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';

export default function PrivacyPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';

  const lastUpdated = 'January 15, 2024';

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
              <Shield className="w-4 h-4" />
              Legal
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-8 bg-white border-b border-cream-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <a href="#introduction" className="text-gold-600 hover:text-gold-700">Introduction</a>
            <a href="#collection" className="text-gray-600 hover:text-gold-600">Information We Collect</a>
            <a href="#use" className="text-gray-600 hover:text-gold-600">How We Use Information</a>
            <a href="#sharing" className="text-gray-600 hover:text-gold-600">Information Sharing</a>
            <a href="#security" className="text-gray-600 hover:text-gold-600">Security</a>
            <a href="#rights" className="text-gray-600 hover:text-gold-600">Your Rights</a>
            <a href="#contact" className="text-gray-600 hover:text-gold-600">Contact Us</a>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-gray">
            <div id="introduction" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                GrandGold (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from us.
              </p>
              <p className="text-gray-600">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </div>

            <div id="collection" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">Personal Data</h3>
              <p className="text-gray-600 mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Register on our website</li>
                <li>Place an order</li>
                <li>Subscribe to our newsletter</li>
                <li>Contact us with inquiries</li>
                <li>Participate in promotions or surveys</li>
              </ul>
              <p className="text-gray-600 mb-4">
                This information may include:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Name, email address, and phone number</li>
                <li>Shipping and billing addresses</li>
                <li>Payment information (processed securely via payment providers)</li>
                <li>Order history and preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3">Automatically Collected Data</h3>
              <p className="text-gray-600 mb-4">
                When you visit our website, we automatically collect certain information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Pages visited and time spent on site</li>
                <li>Referral sources</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div id="use" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about orders, products, and promotions</li>
                <li>Improve our website and customer experience</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
                <li>Personalize your shopping experience</li>
              </ul>
            </div>

            <div id="sharing" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
              <p className="text-gray-600 mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Service Providers:</strong> Payment processors, shipping companies, and IT service providers who help us operate our business</li>
                <li><strong>Business Partners:</strong> Trusted partners for marketing purposes (only with your consent)</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="text-gray-600">
                We do not sell your personal information to third parties.
              </p>
            </div>

            <div id="security" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement appropriate technical and organizational measures to protect your personal data, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>SSL/TLS encryption for all data transmission</li>
                <li>Secure payment processing (PCI-DSS compliant)</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection</li>
              </ul>
            </div>

            <div id="rights" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-600 mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Request transfer of your data</li>
                <li><strong>Objection:</strong> Object to certain data processing</li>
                <li><strong>Withdrawal:</strong> Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, please contact us using the information below.
              </p>
            </div>

            <div id="contact" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-cream-50 rounded-xl p-6">
                <p className="text-gray-800 font-medium">GrandGold Privacy Team</p>
                <p className="text-gray-600">Email: privacy@thegrandgold.com</p>
                <p className="text-gray-600">Phone: +91 22 1234 5678</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-8 bg-white border-t border-cream-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-center">
            <Link href={`/${country}/terms`} className="text-gold-600 hover:text-gold-700 flex items-center gap-1">
              Terms of Service <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href={`/${country}/cookies`} className="text-gold-600 hover:text-gold-700 flex items-center gap-1">
              Cookie Policy <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
