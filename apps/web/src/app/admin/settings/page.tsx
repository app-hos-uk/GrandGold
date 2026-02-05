'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Store,
  CreditCard,
  Truck,
  Bell,
  Shield,
  Save,
  Check,
  X,
  Loader2,
  Plug,
  TrendingUp,
} from 'lucide-react';

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'store', label: 'Store', icon: Store },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'integrations', label: 'API Integrations', icon: Plug },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'tax', label: 'Tax & Duties', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

type MetalPricingProvider = 'metalpriceapi' | 'metalsdev';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);
  const [configModal, setConfigModal] = useState<'razorpay' | 'stripe' | null>(null);
  const [metalPricingModalOpen, setMetalPricingModalOpen] = useState(false);
  const [metalPricingStatus, setMetalPricingStatus] = useState<{
    provider: MetalPricingProvider;
    apiKeyConfigured: boolean;
    baseUrl: string;
  } | null>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    if (activeTab !== 'integrations') return;
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((d) => {
        const mp = d?.data?.integrations?.metalPricing;
        if (mp) {
          setMetalPricingStatus({
            provider: mp.provider || 'metalpriceapi',
            apiKeyConfigured: !!mp.apiKeyConfigured,
            baseUrl: mp.baseUrl || '',
          });
        } else {
          setMetalPricingStatus({
            provider: 'metalpriceapi',
            apiKeyConfigured: false,
            baseUrl: '',
          });
        }
      })
      .catch(() => setMetalPricingStatus({ provider: 'metalpriceapi', apiKeyConfigured: false, baseUrl: '' }));
  }, [activeTab]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your platform settings</p>
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
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">General Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    defaultValue="GrandGold"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    defaultValue="support@thegrandgold.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500">
                    <option>INR (₹)</option>
                    <option>AED (د.إ)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500">
                    <option>Asia/Kolkata (IST)</option>
                    <option>Asia/Dubai (GST)</option>
                    <option>Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'store' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Store Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gold Price Update Frequency
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500">
                    <option>Every 1 minute</option>
                    <option>Every 5 minutes</option>
                    <option>Every 15 minutes</option>
                    <option>Every hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Making Charges (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="12"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="3"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Enable AR Try-On</p>
                    <p className="text-sm text-gray-500">Allow customers to try jewellery virtually</p>
                  </div>
                  <button type="button" className="relative w-12 h-6 bg-gold-500 rounded-full">
                    <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Payment Settings & API Configuration</h2>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">R</span>
                      </div>
                      <div>
                        <p className="font-medium">Razorpay</p>
                        <p className="text-sm text-gray-500">UPI, Cards, Netbanking (India)</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
                  </div>
                  <button
                    onClick={() => setConfigModal('razorpay')}
                    className="text-sm text-gold-600 font-medium hover:text-gold-700"
                  >
                    Configure
                  </button>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">S</span>
                      </div>
                      <div>
                        <p className="font-medium">Stripe</p>
                        <p className="text-sm text-gray-500">International Cards (UK, UAE)</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
                  </div>
                  <button
                    onClick={() => setConfigModal('stripe')}
                    className="text-sm text-gold-600 font-medium hover:text-gold-700"
                  >
                    Configure
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-2">API Integrations</h2>
              <p className="text-sm text-gray-500 mb-6">
                Configure third-party API credentials for live data (metal pricing, etc.). Only Super Admins can manage these settings.
              </p>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Live Metal Pricing</p>
                        <p className="text-sm text-gray-500">
                          Gold, silver, platinum rates by country (MetalpriceAPI or Metals.Dev)
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        metalPricingStatus?.apiKeyConfigured
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {metalPricingStatus?.apiKeyConfigured ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  {metalPricingStatus?.apiKeyConfigured && (
                    <p className="text-xs text-gray-500 mb-3">
                      Provider: {metalPricingStatus.provider === 'metalpriceapi' ? 'MetalpriceAPI' : 'Metals.Dev'}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setMetalPricingModalOpen(true)}
                    className="text-sm text-gold-600 font-medium hover:text-gold-700"
                  >
                    {metalPricingStatus?.apiKeyConfigured ? 'Update credentials' : 'Configure'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  More integrations (payments, email, SMS) can be added here. Payment gateways are under the Payments tab.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'shipping' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Shipping Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold (₹)
                  </label>
                  <input
                    type="number"
                    defaultValue="10000"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard Shipping Fee (₹)
                  </label>
                  <input
                    type="number"
                    defaultValue="500"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Express Shipping Fee (₹)
                  </label>
                  <input
                    type="number"
                    defaultValue="1000"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Insurance</p>
                    <p className="text-sm text-gray-500">Auto-insure all shipments</p>
                  </div>
                  <button type="button" className="relative w-12 h-6 bg-gold-500 rounded-full">
                    <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tax' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-6">Tax & Duty Settings</h2>
              <div className="space-y-6">
                {/* India Tax Settings */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🇮🇳</span>
                    <span className="font-semibold text-gray-900">India Tax Settings</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                      <input
                        type="number"
                        defaultValue="3"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Applied to all gold/jewellery sales</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Making Charges GST (%)</label>
                      <input
                        type="number"
                        defaultValue="5"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  </div>
                </div>

                {/* UAE Tax Settings */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🇦🇪</span>
                    <span className="font-semibold text-gray-900">UAE Tax Settings</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                      <input
                        type="number"
                        defaultValue="5"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Import Duty (%)</label>
                      <input
                        type="number"
                        defaultValue="5"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  </div>
                </div>

                {/* UK Tax Settings */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🇬🇧</span>
                    <span className="font-semibold text-gray-900">UK Tax Settings</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                      <input
                        type="number"
                        defaultValue="20"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Import Duty (%)</label>
                      <input
                        type="number"
                        defaultValue="2.5"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Calculation Options */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4">Tax Display Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="taxDisplay" defaultChecked className="text-gold-500" />
                      <span className="text-sm text-gray-700">Display prices inclusive of tax</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="taxDisplay" className="text-gold-500" />
                      <span className="text-sm text-gray-700">Display prices exclusive of tax (add at checkout)</span>
                    </label>
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
              <h2 className="text-lg font-semibold mb-6">Notification Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'New Order', desc: 'Get notified when a new order is placed' },
                  { label: 'Order Shipped', desc: 'Notify when order is shipped' },
                  { label: 'Low Stock Alert', desc: 'Alert when product stock is low' },
                  { label: 'New Seller Registration', desc: 'Notify on new seller signup' },
                  { label: 'Customer Reviews', desc: 'Get notified on new reviews' },
                  { label: 'Daily Summary', desc: 'Receive daily sales summary' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button type="button" className="relative w-12 h-6 bg-gold-500 rounded-full">
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
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Two-Factor Authentication</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">2FA is enabled for all admin accounts</p>
                  <button type="button" className="text-sm text-green-700 font-medium underline">Manage 2FA</button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Policy
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500">
                    <option>Strong (min 12 chars, special chars required)</option>
                    <option>Medium (min 8 chars)</option>
                    <option>Basic (min 6 chars)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4">Recent Login Activity</h3>
                  <div className="space-y-3">
                    {[
                      { device: 'Chrome on MacOS', location: 'Mumbai, IN', time: '2 min ago' },
                      { device: 'Safari on iPhone', location: 'Mumbai, IN', time: '1 hour ago' },
                      { device: 'Firefox on Windows', location: 'Delhi, IN', time: '2 days ago' },
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{session.device}</p>
                          <p className="text-xs text-gray-500">{session.location}</p>
                        </div>
                        <span className="text-xs text-gray-500">{session.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* API Configuration Modal */}
      <AnimatePresence>
        {configModal && (
          <ApiConfigModal
            key="api-config-modal"
            provider={configModal}
            onClose={() => setConfigModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Live Metal Pricing API credentials modal */}
      <AnimatePresence>
        {metalPricingModalOpen && (
          <MetalPricingConfigModal
            initialStatus={metalPricingStatus}
            onClose={() => setMetalPricingModalOpen(false)}
            onSaved={(status) => {
              setMetalPricingStatus(status);
              setMetalPricingModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MetalPricingConfigModal({
  initialStatus,
  onClose,
  onSaved,
}: {
  initialStatus: { provider: MetalPricingProvider; apiKeyConfigured: boolean; baseUrl: string } | null;
  onClose: () => void;
  onSaved: (status: { provider: MetalPricingProvider; apiKeyConfigured: boolean; baseUrl: string }) => void;
}) {
  const [provider, setProvider] = useState<MetalPricingProvider>(initialStatus?.provider || 'metalpriceapi');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(initialStatus?.baseUrl || '');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch('/api/rates/metals?currencies=INR');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Test failed');
      setSuccess('Connection successful. Rates are being fetched.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection test failed. Save credentials first.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrations: {
            metalPricing: {
              provider,
              apiKey: apiKey || undefined,
              baseUrl: baseUrl || undefined,
            },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to save');
      setSuccess('Credentials saved. You can test the connection.');
      onSaved({
        provider,
        apiKeyConfigured: !!apiKey || !!initialStatus?.apiKeyConfigured,
        baseUrl,
      });
      setTimeout(() => {
        if (mountedRef.current) {
          setSuccess(null);
          onClose();
        }
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Live Metal Pricing API</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <Check className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as MetalPricingProvider)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="metalpriceapi">MetalpriceAPI</option>
              <option value="metalsdev">Metals.Dev</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {provider === 'metalpriceapi'
                ? 'Gold/silver in 150+ currencies. Free tier available.'
                : 'Enterprise-grade; 170+ currencies.'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={initialStatus?.apiKeyConfigured ? 'Leave blank to keep existing' : 'Your API key'}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL (optional)</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider === 'metalpriceapi' ? 'https://api.metalpriceapi.com' : 'https://api.metals.dev'}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || (!apiKey && !initialStatus?.apiKeyConfigured)}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {testing ? 'Testing...' : 'Test connection'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ApiConfigModal({
  provider,
  onClose,
}: {
  provider: 'razorpay' | 'stripe';
  onClose: () => void;
}) {
  const [form, setForm] = useState({ keyId: '', keySecret: '', publishableKey: '', secretKey: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data) setForm((f) => ({ ...f, keyId: d.data.razorpay?.keyId || '', publishableKey: d.data.stripe?.publishableKey || '' }));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          provider === 'razorpay'
            ? { razorpay: { keyId: form.keyId, keySecret: form.keySecret } }
            : { stripe: { publishableKey: form.publishableKey, secretKey: form.secretKey } }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to save');
      setSuccess('Configuration saved successfully');
      setTimeout(() => { onClose(); setSuccess(null); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Configure {provider === 'razorpay' ? 'Razorpay' : 'Stripe'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <Check className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          ) : provider === 'razorpay' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key ID</label>
                <input
                  value={form.keyId}
                  onChange={(e) => setForm((f) => ({ ...f, keyId: e.target.value }))}
                  placeholder="rzp_live_xxx or rzp_test_xxx"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Secret</label>
                <input
                  type="password"
                  value={form.keySecret}
                  onChange={(e) => setForm((f) => ({ ...f, keySecret: e.target.value }))}
                  placeholder="Leave blank to keep existing"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                <input
                  value={form.publishableKey}
                  onChange={(e) => setForm((f) => ({ ...f, publishableKey: e.target.value }))}
                  placeholder="pk_live_xxx or pk_test_xxx"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={form.secretKey}
                  onChange={(e) => setForm((f) => ({ ...f, secretKey: e.target.value }))}
                  placeholder="Leave blank to keep existing"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
