'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Check,
  ChevronDown,
} from 'lucide-react';

const contactInfo = {
  in: {
    phone: '+91 9567455916',
    whatsapp: '+919567455916',
    email: 'Info@thegrandgold.com',
    address: '1st Floor, Dale Nest Building, Mini Bypass Road, Arayidathupalam, Kozhikode, Kerala - 673004',
    hours: 'Mon-Sat: 10:00 AM - 7:00 PM IST',
  },
  ae: {
    phone: '+971 4 123 4567',
    whatsapp: '+971 50 123 4567',
    email: 'uae@thegrandgold.com',
    address: 'Gold Souk, Deira, Dubai, UAE',
    hours: 'Sat-Thu: 10:00 AM - 10:00 PM GST',
  },
  uk: {
    phone: '+44 20 1234 5678',
    whatsapp: '+44 7700 123456',
    email: 'uk@thegrandgold.com',
    address: '123 Bond Street, Mayfair, London W1S, UK',
    hours: 'Mon-Sat: 10:00 AM - 6:00 PM GMT',
  },
};

const subjects = [
  'Product Inquiry',
  'Order Status',
  'Returns & Refunds',
  'Custom Orders',
  'Technical Support',
  'Business Inquiry',
  'Feedback',
  'Other',
];

export default function ContactPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const info = contactInfo[country];
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
              Message Sent!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for contacting us. Our team will get back to you within 24 hours.
            </p>
            <div className="bg-cream-50 rounded-xl p-4 text-sm text-gray-600 mb-6">
              <p>Reference: #GG{Date.now().toString().slice(-8)}</p>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
              }}
              className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
            >
              Send Another Message
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
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-gray-600 text-lg">
              We&apos;re here to help! Reach out to us for any questions about our products,
              orders, or custom jewellery requests.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold mb-6">Contact Information</h2>
                
                <div className="space-y-5">
                  <a href={`tel:${info.phone}`} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold-200 transition-colors">
                      <Phone className="w-5 h-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{info.phone}</p>
                    </div>
                  </a>

                  <a href={`https://wa.me/${info.whatsapp.replace(/\s/g, '')}`} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">WhatsApp</p>
                      <p className="font-medium text-gray-900">{info.whatsapp}</p>
                    </div>
                  </a>

                  <a href={`mailto:${info.email}`} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{info.email}</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{info.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Business Hours</p>
                      <p className="font-medium text-gray-900">{info.hours}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
              >
                <h3 className="font-semibold mb-4">Quick Help</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href={`/${country}/help`} className="text-gray-300 hover:text-gold-400 transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href={`/${country}/faq`} className="text-gray-300 hover:text-gold-400 transition-colors">
                      FAQs
                    </a>
                  </li>
                  <li>
                    <a href={`/${country}/shipping`} className="text-gray-300 hover:text-gold-400 transition-colors">
                      Shipping Information
                    </a>
                  </li>
                  <li>
                    <a href={`/${country}/returns`} className="text-gray-300 hover:text-gold-400 transition-colors">
                      Returns & Refunds
                    </a>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <div className="bg-white rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-6">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
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
                        placeholder="John Doe"
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
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full appearance-none px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        >
                          <option value="">Select a subject</option>
                          {subjects.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>

                  <p className="text-sm text-gray-500 text-center">
                    By submitting this form, you agree to our Privacy Policy
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Visit Our Store</h2>
            <div className="bg-cream-100 rounded-2xl h-80 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gold-500 mx-auto mb-4" />
                <p className="text-gray-600">{info.address}</p>
                <button className="mt-4 text-gold-600 font-medium hover:text-gold-700">
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
