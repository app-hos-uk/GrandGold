'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cookie, ChevronRight, Check } from 'lucide-react';

export default function CookiesPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';

  const lastUpdated = 'January 15, 2024';

  const [preferences, setPreferences] = useState({
    essential: true,
    functional: true,
    analytics: true,
    marketing: false,
  });

  const handleSavePreferences = () => {
    // In a real app, this would save to cookies/localStorage
    alert('Cookie preferences saved!');
  };

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
              <Cookie className="w-4 h-4" />
              Legal
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Cookie Policy
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
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
                <p className="text-gray-600 mb-4">
                  Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, keeping you logged in, and understanding how you use our site.
                </p>
                <p className="text-gray-600">
                  We use both first-party cookies (set by us) and third-party cookies (set by our partners) to improve your browsing experience.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
                
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Essential Cookies</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Always Active
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      These cookies are necessary for the website to function properly. They enable basic features like page navigation, secure areas access, and shopping cart functionality.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Session management</li>
                      <li>• Shopping cart functionality</li>
                      <li>• Security and fraud prevention</li>
                      <li>• Load balancing</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Functional Cookies</h3>
                      <button
                        onClick={() => setPreferences({ ...preferences, functional: !preferences.functional })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.functional ? 'bg-gold-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.functional ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Language preferences</li>
                      <li>• Country/currency settings</li>
                      <li>• Recently viewed products</li>
                      <li>• Wishlist items</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Analytics Cookies</h3>
                      <button
                        onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.analytics ? 'bg-gold-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.analytics ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      These cookies help us understand how visitors interact with our website by collecting anonymous information about page visits and user behavior.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Page views and sessions</li>
                      <li>• Time spent on pages</li>
                      <li>• Navigation patterns</li>
                      <li>• Error tracking</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Marketing Cookies</h3>
                      <button
                        onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.marketing ? 'bg-gold-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.marketing ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      These cookies are used to deliver personalized advertisements and measure the effectiveness of our marketing campaigns.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Targeted advertising</li>
                      <li>• Retargeting campaigns</li>
                      <li>• Social media integration</li>
                      <li>• Conversion tracking</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="mt-6 w-full py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Save Cookie Preferences
                </button>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Cookies</h2>
                <p className="text-gray-600 mb-4">
                  You can control and manage cookies in several ways:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies through settings</li>
                  <li><strong>Our Cookie Banner:</strong> Use our cookie consent banner to manage preferences</li>
                  <li><strong>Opt-Out Tools:</strong> Use industry opt-out tools like NAI or DAA</li>
                </ul>
                <p className="text-gray-600">
                  Note: Blocking certain cookies may affect your experience on our website and limit functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
                <p className="text-gray-600 mb-4">
                  We work with the following third-party services that may place cookies:
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    'Google Analytics',
                    'Facebook Pixel',
                    'Google Ads',
                    'Stripe (Payments)',
                    'Razorpay',
                    'Intercom',
                  ].map((service) => (
                    <div key={service} className="bg-cream-100 rounded-lg p-3 text-sm text-gray-700">
                      {service}
                    </div>
                  ))}
                </div>
                <p className="text-gray-600">
                  Each of these services has their own privacy and cookie policies. We recommend reviewing them for more information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
                <p className="text-gray-600">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any significant changes by posting a notice on our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-600 mb-4">
                  If you have questions about our use of cookies, please contact us:
                </p>
                <div className="bg-cream-50 rounded-xl p-6">
                  <p className="text-gray-800 font-medium">GrandGold Privacy Team</p>
                  <p className="text-gray-600">Email: privacy@thegrandgold.com</p>
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
            <Link href={`/${country}/terms`} className="text-gold-600 hover:text-gold-700 flex items-center gap-1">
              Terms of Service <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
