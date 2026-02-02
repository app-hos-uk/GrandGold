'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Globe,
  Shield,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

const user = {
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya.sharma@email.com',
  phone: '+91 98765 43210',
  language: 'English',
  currency: 'INR',
};

export default function SettingsPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileData, setProfileData] = useState(user);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    priceAlerts: true,
    promotions: false,
    newsletter: true,
    sms: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href={`/${country}/account`} className="text-gray-500 hover:text-gold-600">
              My Account
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Settings</span>
          </nav>
        </div>
      </div>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Account Settings</h1>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="lg:w-64 flex-shrink-0">
                <nav className="bg-white rounded-2xl overflow-hidden">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gold-50 text-gold-700 border-l-4 border-gold-500'
                          : 'text-gray-600 hover:bg-cream-50'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl p-6"
                  >
                    <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
                    
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {saved ? <Check className="w-5 h-5" /> : null}
                        {saved ? 'Saved!' : 'Save Changes'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl p-6"
                  >
                    <h2 className="text-lg font-semibold mb-6">Change Password</h2>
                    
                    <div className="space-y-6 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Must be at least 8 characters with a number and special character
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        />
                      </div>

                      <button className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors">
                        Update Password
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl p-6"
                  >
                    <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
                    
                    <div className="space-y-6">
                      {[
                        { key: 'orderUpdates', label: 'Order Updates', desc: 'Receive updates about your orders' },
                        { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when gold prices change' },
                        { key: 'promotions', label: 'Promotions', desc: 'Special offers and discounts' },
                        { key: 'newsletter', label: 'Newsletter', desc: 'Weekly curated collections and trends' },
                        { key: 'sms', label: 'SMS Notifications', desc: 'Receive important updates via SMS' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-cream-100 last:border-0">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications({
                              ...notifications,
                              [item.key]: !notifications[item.key as keyof typeof notifications],
                            })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              notifications[item.key as keyof typeof notifications]
                                ? 'bg-gold-500'
                                : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                notifications[item.key as keyof typeof notifications]
                                  ? 'left-7'
                                  : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl p-6"
                  >
                    <h2 className="text-lg font-semibold mb-6">Regional Preferences</h2>
                    
                    <div className="space-y-6 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500">
                          <option>English</option>
                          <option>हिन्दी (Hindi)</option>
                          <option>العربية (Arabic)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500">
                          <option>INR (₹)</option>
                          <option>AED (د.إ)</option>
                          <option>GBP (£)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weight Unit
                        </label>
                        <select className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500">
                          <option>Grams (g)</option>
                          <option>Tola</option>
                          <option>Ounces (oz)</option>
                        </select>
                      </div>

                      <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl p-6"
                  >
                    <h2 className="text-lg font-semibold mb-6">Security Settings</h2>
                    
                    <div className="space-y-6">
                      <div className="p-4 bg-cream-50 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-gold-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500">Add an extra layer of security</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium rounded-lg transition-colors">
                          Enable
                        </button>
                      </div>

                      <div className="border-t border-cream-200 pt-6">
                        <h3 className="font-medium text-gray-900 mb-4">Recent Login Activity</h3>
                        <div className="space-y-3">
                          {[
                            { device: 'Chrome on MacOS', location: 'Mumbai, India', time: '2 minutes ago', current: true },
                            { device: 'Safari on iPhone', location: 'Mumbai, India', time: '1 day ago', current: false },
                            { device: 'Chrome on Windows', location: 'Delhi, India', time: '3 days ago', current: false },
                          ].map((session, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-cream-100 last:border-0">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{session.device}</p>
                                  {session.current && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{session.location} • {session.time}</p>
                              </div>
                              {!session.current && (
                                <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                                  Logout
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-cream-200 pt-6">
                        <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Once you delete your account, there is no going back.
                        </p>
                        <button className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
