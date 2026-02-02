'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Palette,
  Gem,
  Ruler,
  MessageCircle,
  Upload,
  Send,
  Check,
  Sparkles,
  Clock,
  Shield,
  Award,
} from 'lucide-react';

const jewelryTypes = [
  'Ring',
  'Necklace',
  'Earrings',
  'Bracelet',
  'Pendant',
  'Bangle',
  'Anklet',
  'Other',
];

const occasions = [
  'Engagement',
  'Wedding',
  'Anniversary',
  'Birthday',
  'Festival',
  'Daily Wear',
  'Gift',
  'Other',
];

const budgetRanges = {
  in: ['Under ₹50,000', '₹50,000 - ₹1,00,000', '₹1,00,000 - ₹3,00,000', '₹3,00,000 - ₹5,00,000', 'Above ₹5,00,000'],
  ae: ['Under AED 5,000', 'AED 5,000 - 15,000', 'AED 15,000 - 30,000', 'AED 30,000 - 50,000', 'Above AED 50,000'],
  uk: ['Under £5,000', '£5,000 - £10,000', '£10,000 - £25,000', '£25,000 - £50,000', 'Above £50,000'],
};

const features = [
  {
    icon: Palette,
    title: 'Design Consultation',
    description: 'Work with our expert designers to create your vision',
  },
  {
    icon: Gem,
    title: 'Premium Materials',
    description: 'Choose from the finest gold, diamonds, and gemstones',
  },
  {
    icon: Shield,
    title: 'Quality Guarantee',
    description: 'Every piece comes with lifetime warranty and certification',
  },
  {
    icon: Clock,
    title: '4-6 Weeks Delivery',
    description: 'Expertly crafted and delivered to your doorstep',
  },
];

export default function CustomOrdersPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jewelryType: '',
    occasion: '',
    budget: '',
    description: '',
    hasReference: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const budgets = budgetRanges[country];

  if (submitted) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto bg-white rounded-2xl p-8 text-center shadow-luxury"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Request Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your custom order request. Our design team will contact you
              within 24-48 hours to discuss your vision.
            </p>
            <div className="bg-cream-50 rounded-xl p-4 text-left text-sm">
              <p className="font-medium mb-2">What happens next?</p>
              <ol className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-gold-600">1</span>
                  </span>
                  Our design expert will call you to understand your requirements
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-gold-600">2</span>
                  </span>
                  We&apos;ll create design sketches for your approval
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-gold-600">3</span>
                  </span>
                  Once approved, your piece will be crafted in 4-6 weeks
                </li>
              </ol>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
            >
              Submit Another Request
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

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
              <Sparkles className="w-4 h-4" />
              Custom Creations
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Create Your Dream Jewellery
            </h1>
            <p className="text-gray-600 text-lg">
              Work with our master craftsmen to bring your unique vision to life.
              From engagement rings to heirloom pieces, we create one-of-a-kind treasures.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b border-cream-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
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
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Tell Us About Your Dream Piece
            </h2>
            
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm">
              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Your phone number"
                />
              </div>

              {/* Jewelry Type */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type of Jewellery *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {jewelryTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, jewelryType: type })}
                      className={`py-2 px-4 rounded-lg text-sm transition-all ${
                        formData.jewelryType === type
                          ? 'bg-gold-500 text-white'
                          : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Occasion
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {occasions.map((occasion) => (
                    <button
                      key={occasion}
                      type="button"
                      onClick={() => setFormData({ ...formData, occasion })}
                      className={`py-2 px-4 rounded-lg text-sm transition-all ${
                        formData.occasion === occasion
                          ? 'bg-gold-500 text-white'
                          : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
                      }`}
                    >
                      {occasion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Budget Range
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {budgets.map((budget) => (
                    <button
                      key={budget}
                      type="button"
                      onClick={() => setFormData({ ...formData, budget })}
                      className={`py-2 px-4 rounded-lg text-sm transition-all ${
                        formData.budget === budget
                          ? 'bg-gold-500 text-white'
                          : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
                      }`}
                    >
                      {budget}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Your Vision *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Tell us about your dream jewellery piece - design elements, gemstones, style preferences, etc."
                />
              </div>

              {/* Reference Images */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Images (Optional)
                </label>
                <div className="border-2 border-dashed border-cream-300 rounded-xl p-8 text-center">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop images here, or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    PNG, JPG up to 10MB each
                  </p>
                  <input type="file" className="hidden" multiple accept="image/*" />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Submit Request
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                Our team will respond within 24-48 hours
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-8">Custom Creations by GrandGold</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "They created the most beautiful engagement ring for my fiancée. The attention to detail was incredible.",
                author: "Rahul M.",
                location: "Mumbai",
              },
              {
                quote: "My grandmother's brooch was transformed into a stunning modern necklace. Family heirloom, new life!",
                author: "Sarah K.",
                location: "London",
              },
              {
                quote: "The custom wedding set exceeded our expectations. True craftsmanship at its finest.",
                author: "Ahmed & Fatima",
                location: "Dubai",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Award key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
