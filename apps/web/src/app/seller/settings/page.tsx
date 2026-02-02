'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  User,
  CreditCard,
  Bell,
  Shield,
  Save,
  Check,
  Upload,
  Sparkles,
} from 'lucide-react';

const tabs = [
  { id: 'store', label: 'Store Profile', icon: Store },
  { id: 'account', label: 'Account', icon: User },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SellerSettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your store settings</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-gold-500 text-white hover:bg-gold-600'
          }`}
        >
          {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-white rounded-xl shadow-sm overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gold-50 text-gold-700 border-l-4 border-gold-500'
                    : 'text-gray-600 hover:bg-gray-50'
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
          {activeTab === 'store' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Store Profile</h2>
              
              {/* Store Logo */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Store Logo
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-gold-100 to-cream-200 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-gold-400" />
                  </div>
                  <div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Royal Jewellers"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Description
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Premium handcrafted gold jewellery with traditional and contemporary designs. Serving customers since 1985."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Email
                    </label>
                    <input
                      type="email"
                      defaultValue="contact@royaljewellers.com"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue="+91 98765 43210"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    rows={2}
                    defaultValue="123 Jewellers Lane, Zaveri Bazaar, Mumbai 400003"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Account Details</h2>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Ravi"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Kumar"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="ravi@royaljewellers.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+91 98765 43210"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bank' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Bank Account Details</h2>
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Bank account verified</span>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Royal Jewellers Pvt Ltd"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    defaultValue="HDFC Bank"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      defaultValue="****4521"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      defaultValue="HDFC0001234"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'New Orders', desc: 'Get notified when you receive a new order' },
                  { label: 'Order Updates', desc: 'Updates on order status changes' },
                  { label: 'Low Stock Alerts', desc: 'Alert when product stock is low' },
                  { label: 'Payout Notifications', desc: 'Updates on payouts and settlements' },
                  { label: 'Customer Messages', desc: 'Receive customer inquiries' },
                  { label: 'Marketing Updates', desc: 'Tips and promotional opportunities' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button className="relative w-12 h-6 bg-gold-500 rounded-full">
                      <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <button className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <button className="px-4 py-2 border border-gold-500 text-gold-600 rounded-lg hover:bg-gold-50 transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
