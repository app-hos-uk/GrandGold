'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  Smartphone,
  Check,
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react';

const goldPrices = {
  in: {
    '24K': { price: 6150, change: 0.5, unit: '/g' },
    '22K': { price: 5638, change: 0.4, unit: '/g' },
    '18K': { price: 4613, change: -0.2, unit: '/g' },
    '14K': { price: 3588, change: 0.3, unit: '/g' },
  },
  ae: {
    '24K': { price: 225, change: 0.5, unit: '/g' },
    '22K': { price: 207, change: 0.4, unit: '/g' },
    '18K': { price: 169, change: -0.2, unit: '/g' },
    '14K': { price: 131, change: 0.3, unit: '/g' },
  },
  uk: {
    '24K': { price: 52, change: 0.5, unit: '/g' },
    '22K': { price: 48, change: 0.4, unit: '/g' },
    '18K': { price: 39, change: -0.2, unit: '/g' },
    '14K': { price: 30, change: 0.3, unit: '/g' },
  },
};

const currencies = {
  in: '₹',
  ae: 'AED ',
  uk: '£',
};

const existingAlerts = [
  { id: '1', type: '24K', condition: 'below', price: 6000, active: true },
  { id: '2', type: '22K', condition: 'above', price: 5800, active: true },
];

export default function PriceAlertsPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const currency = currencies[country];
  const prices = goldPrices[country];
  
  const [alerts, setAlerts] = useState(existingAlerts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: '24K',
    condition: 'below',
    price: '',
    email: true,
    sms: false,
  });

  const formatPrice = (price: number) => {
    return `${currency}${price.toLocaleString()}`;
  };

  const handleCreateAlert = () => {
    if (newAlert.price) {
      setAlerts([
        ...alerts,
        {
          id: Date.now().toString(),
          type: newAlert.type,
          condition: newAlert.condition,
          price: parseFloat(newAlert.price),
          active: true,
        },
      ]);
      setShowCreateModal(false);
      setNewAlert({ type: '24K', condition: 'below', price: '', email: true, sms: false });
    }
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
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
              <Bell className="w-4 h-4" />
              Price Alerts
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Gold Price Alerts
            </h1>
            <p className="text-gray-600 text-lg">
              Never miss the right moment to buy. Set custom alerts and get notified
              when gold prices reach your target.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Live Prices */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-xl font-semibold mb-6">Current Gold Rates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(prices).map(([purity, data]) => (
              <div key={purity} className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-gold-400 font-medium mb-1">{purity} Gold</p>
                <p className="text-2xl font-bold">
                  {formatPrice(data.price)}
                  <span className="text-sm font-normal text-gray-400">{data.unit}</span>
                </p>
                <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${
                  data.change > 0 ? 'text-green-400' : data.change < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {data.change > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : data.change < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                  <span>{data.change > 0 ? '+' : ''}{data.change}%</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </section>

      {/* My Alerts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">My Price Alerts</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                Create Alert
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No alerts yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first price alert to get notified when gold prices change.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
                >
                  Create Your First Alert
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        alert.active ? 'bg-gold-100' : 'bg-gray-100'
                      }`}>
                        {alert.condition === 'below' ? (
                          <TrendingDown className={`w-6 h-6 ${alert.active ? 'text-gold-600' : 'text-gray-400'}`} />
                        ) : (
                          <TrendingUp className={`w-6 h-6 ${alert.active ? 'text-gold-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {alert.type} Gold {alert.condition === 'below' ? 'drops below' : 'rises above'} {formatPrice(alert.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Current: {formatPrice(prices[alert.type as keyof typeof prices].price)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          alert.active ? 'bg-gold-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            alert.active ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-8">How Price Alerts Work</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: 1,
                  title: 'Set Your Target',
                  description: 'Choose the gold purity and set your target price',
                },
                {
                  step: 2,
                  title: 'Get Notified',
                  description: 'Receive instant notifications when price hits your target',
                },
                {
                  step: 3,
                  title: 'Make Your Move',
                  description: 'Shop at the perfect price and save more',
                },
              ].map((item) => (
                <div key={item.step}>
                  <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Create Price Alert</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Gold Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gold Purity
                </label>
                <div className="relative">
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                    className="w-full appearance-none px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="24K">24K Gold</option>
                    <option value="22K">22K Gold</option>
                    <option value="18K">18K Gold</option>
                    <option value="14K">14K Gold</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert When Price
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewAlert({ ...newAlert, condition: 'below' })}
                    className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      newAlert.condition === 'below'
                        ? 'bg-gold-500 text-white'
                        : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5" />
                    Drops Below
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAlert({ ...newAlert, condition: 'above' })}
                    className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      newAlert.condition === 'above'
                        ? 'bg-gold-500 text-white'
                        : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Rises Above
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Price (per gram)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={newAlert.price}
                    onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter target price"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Current {newAlert.type} price: {formatPrice(prices[newAlert.type as keyof typeof prices].price)}
                </p>
              </div>

              {/* Notification Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notify Me Via
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAlert.email}
                      onChange={(e) => setNewAlert({ ...newAlert, email: e.target.checked })}
                      className="w-4 h-4 text-gold-500 rounded focus:ring-gold-500"
                    />
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAlert.sms}
                      onChange={(e) => setNewAlert({ ...newAlert, sms: e.target.checked })}
                      className="w-4 h-4 text-gold-500 rounded focus:ring-gold-500"
                    />
                    <Smartphone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">SMS</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleCreateAlert}
                disabled={!newAlert.price}
                className="w-full py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                Create Alert
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
