'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  CreditCard,
  Bell,
  LogOut,
  ChevronRight,
  Edit2,
  Sparkles,
  Shield,
} from 'lucide-react';

const user = {
  name: 'Priya Sharma',
  email: 'priya.sharma@email.com',
  phone: '+91 98765 43210',
  memberSince: 'January 2024',
  tier: 'Gold Member',
};

const recentOrders = [
  {
    id: 'GG-2024-001',
    date: '15 Jan 2024',
    total: 185000,
    status: 'Delivered',
    items: 1,
  },
  {
    id: 'GG-2024-002',
    date: '28 Jan 2024',
    total: 78500,
    status: 'Processing',
    items: 2,
  },
];

const menuItems = [
  { icon: Package, label: 'My Orders', href: '/account/orders', badge: '2' },
  { icon: MapPin, label: 'Addresses', href: '/account/addresses' },
  { icon: Heart, label: 'Wishlist', href: '/wishlist', badge: '5' },
  { icon: CreditCard, label: 'Payment Methods', href: '/account/payments' },
  { icon: Bell, label: 'Notifications', href: '/account/notifications' },
  { icon: Settings, label: 'Account Settings', href: '/account/settings' },
];

const countryConfig = {
  in: { currency: '₹' },
  ae: { currency: 'AED ' },
  uk: { currency: '£' },
};

export default function AccountPage() {
  const params = useParams();
  const router = useRouter();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const config = countryConfig[country];
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken')
        : null;
    if (!token) {
      router.replace(`/${country}/login?redirect=${encodeURIComponent(`/${country}/account`)}`);
      return;
    }
    setAuthChecked(true);
  }, [country, router]);

  const formatPrice = (price: number) => {
    return `${config.currency}${price.toLocaleString()}`;
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gold-500 rounded-xl" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Header */}
      <section className="bg-gradient-luxury py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
                <span className="px-2 py-0.5 bg-gold-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {user.tier}
                </span>
              </div>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">Member since {user.memberSince}</p>
            </div>
            <button className="ml-auto p-2 bg-white rounded-full hover:bg-cream-100 transition-colors">
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl overflow-hidden">
                {menuItems.map((item, index) => (
                  <Link
                    key={item.label}
                    href={`/${country}${item.href}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-cream-50 transition-colors border-b border-cream-100 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-gold-100 text-gold-700 text-xs font-medium rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
                
                <button className="w-full flex items-center gap-4 px-6 py-4 text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>

              {/* Membership Card */}
              <div className="mt-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-gold-400" />
                  <span className="font-medium">GrandGold Rewards</span>
                </div>
                <p className="text-3xl font-bold mb-1">2,450</p>
                <p className="text-gray-400 text-sm mb-4">Points earned</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Next tier: Platinum</span>
                  <span className="text-gold-400">550 points away</span>
                </div>
                <div className="mt-2 bg-gray-700 rounded-full h-2">
                  <div className="bg-gold-500 h-2 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Orders */}
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Recent Orders</h2>
                  <Link
                    href={`/${country}/account/orders`}
                    className="text-gold-600 text-sm font-medium hover:text-gold-700"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/${country}/account/orders/${order.id}`}
                      className="block p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{order.id}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          order.status === 'Delivered'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{order.date} • {order.items} item(s)</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Package, label: 'Track Order', color: 'bg-blue-100 text-blue-600' },
                    { icon: Heart, label: 'Wishlist', color: 'bg-red-100 text-red-600' },
                    { icon: Bell, label: 'Price Alerts', color: 'bg-gold-100 text-gold-600' },
                    { icon: User, label: 'Edit Profile', color: 'bg-purple-100 text-purple-600' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-cream-50 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Addresses Preview */}
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Saved Addresses</h2>
                  <Link
                    href={`/${country}/account/addresses`}
                    className="text-gold-600 text-sm font-medium hover:text-gold-700"
                  >
                    Manage
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-cream-50 rounded-xl border-2 border-gold-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Home</span>
                      <span className="px-2 py-0.5 bg-gold-100 text-gold-700 text-xs rounded">Default</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      123 Gold Street, Bandra West<br />
                      Mumbai, Maharashtra 400050
                    </p>
                  </div>
                  <div className="p-4 bg-cream-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Office</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      456 Business Park<br />
                      Mumbai, Maharashtra 400093
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
