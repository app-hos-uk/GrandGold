'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, ChevronRight } from 'lucide-react';

export default function TermsPage() {
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
              <FileText className="w-4 h-4" />
              Legal
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gold-50 border border-gold-200 rounded-xl p-6 mb-8">
              <p className="text-gold-800">
                Please read these Terms of Service carefully before using our website or making a purchase. By accessing or using our services, you agree to be bound by these terms.
              </p>
            </div>

            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 mb-4">
                  By accessing or using the GrandGold website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use of Website</h2>
                <p className="text-gray-600 mb-4">You agree to use our website only for lawful purposes and in a way that does not:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Interfere with the proper working of the website</li>
                  <li>Attempt to gain unauthorized access to any part of our systems</li>
                  <li>Use automated systems to access the site without permission</li>
                  <li>Transmit viruses or malicious code</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Products and Pricing</h2>
                <p className="text-gray-600 mb-4">
                  We strive to display accurate product information and pricing. However:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>All prices are subject to change based on live gold rates</li>
                  <li>Product images are for illustration and may vary slightly from actual items</li>
                  <li>We reserve the right to correct any pricing errors</li>
                  <li>Product weights are approximate and may have minor variations</li>
                  <li>Availability is subject to stock and may change without notice</li>
                </ul>
                <p className="text-gray-600">
                  Gold prices fluctuate based on international market rates. The price at checkout is the final price for your order.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Orders and Payment</h2>
                <p className="text-gray-600 mb-4">When you place an order:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>You must provide accurate and complete information</li>
                  <li>You confirm you are authorized to use the payment method</li>
                  <li>We reserve the right to refuse or cancel any order</li>
                  <li>Order confirmation constitutes acceptance of the order</li>
                  <li>Payment is due at the time of order placement</li>
                </ul>
                <p className="text-gray-600">
                  We may verify your identity and payment method before processing orders of high value.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Shipping and Delivery</h2>
                <p className="text-gray-600 mb-4">
                  Shipping terms and delivery times are estimates and not guaranteed. We are not responsible for:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Delays caused by shipping carriers</li>
                  <li>Delays due to customs or import restrictions</li>
                  <li>Incorrect delivery addresses provided by customers</li>
                  <li>Force majeure events affecting delivery</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Returns and Refunds</h2>
                <p className="text-gray-600 mb-4">
                  Our return and refund policies are outlined in our Returns Policy. Key points:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Items must be returned in original condition</li>
                  <li>Custom-made items are non-returnable</li>
                  <li>Refunds are processed after inspection</li>
                  <li>Return shipping may be at customer&apos;s expense for change of mind</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
                <p className="text-gray-600 mb-4">
                  All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of GrandGold or its licensors and is protected by intellectual property laws.
                </p>
                <p className="text-gray-600">
                  You may not reproduce, distribute, modify, or create derivative works without our prior written consent.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-600 mb-4">
                  To the fullest extent permitted by law, GrandGold shall not be liable for:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of profits or data</li>
                  <li>Errors or omissions in content</li>
                  <li>Unauthorized access to your data</li>
                  <li>Interruption or cessation of services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
                <p className="text-gray-600">
                  You agree to indemnify and hold harmless GrandGold, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the website or violation of these terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Governing Law</h2>
                <p className="text-gray-600">
                  These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction where GrandGold is registered, without regard to conflict of law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts in that jurisdiction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
                <p className="text-gray-600">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the website. Your continued use of the website after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
                <p className="text-gray-600 mb-4">
                  For questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-cream-50 rounded-xl p-6">
                  <p className="text-gray-800 font-medium">GrandGold Legal Team</p>
                  <p className="text-gray-600">Email: legal@thegrandgold.com</p>
                  <p className="text-gray-600">Phone: +91 22 1234 5678</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-8 bg-white border-t border-cream-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-center">
            <Link href={`/${country}/privacy`} className="text-gold-600 hover:text-gold-700 flex items-center gap-1">
              Privacy Policy <ChevronRight className="w-4 h-4" />
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
