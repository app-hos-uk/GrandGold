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
  Loader2,
} from 'lucide-react';
import { authApi, type CurrentUserProfile } from '@/lib/api';

const menuItems = [
  { icon: Package, label: 'My Orders', href: '/account/orders' },
  { icon: MapPin, label: 'Addresses', href: '/account/addresses' },
  { icon: Heart, label: 'Wishlist', href: '/wishlist' },
  { icon: CreditCard, label: 'Payment Methods', href: '/account/payments' },
  { icon: Bell, label: 'Notifications', href: '/account/notifications' },
  { icon: Settings, label: 'Account Settings', href: '/account/settings' },
];

export default function AccountPage() {
  const params = useParams();
  const router = useRouter();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);

  // Dynamic page title
  useEffect(() => {
    document.title = 'My Account | GrandGold';
  }, []);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken')
        : null;
    if (!token) {
      router.replace(`/${country}/login?redirect=${encodeURIComponent(`/${country}/account`)}`);
      return;
    }
    authApi.getMe()
      .then((user) => setProfile(user))
      .catch(() => {
        router.replace(`/${country}/login?redirect=${encodeURIComponent(`/${country}/account`)}`);
      })
      .finally(() => setLoading(false));
  }, [country, router]);

  const handleSignOut = () => {
    authApi.logout();
    router.replace(`/${country}/login`);
    router.refresh();
  };

  if (loading || !profile) {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <p className="text-gray-500 font-medium">Loading your account...</p>
        </div>
      </main>
    );
  }

  const displayName = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email;

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
                <h1 className="text-2xl font-semibold text-gray-900">{displayName}</h1>
                <span className="px-2 py-0.5 bg-gold-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Member
                </span>
              </div>
              <p className="text-gray-600">{profile.email}</p>
              {profile.kycStatus === 'approved' && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> KYC Verified
                </p>
              )}
            </div>
            <Link href={`/${country}/account/settings`} className="ml-auto p-2 bg-white rounded-full hover:bg-cream-100 transition-colors">
              <Edit2 className="w-5 h-5 text-gray-600" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl overflow-hidden">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={`/${country}${item.href}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-cream-50 transition-colors border-b border-cream-100 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 px-6 py-4 text-red-600 hover:bg-red-50 transition-colors"
                >
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
                  <h2 className="text-lg font-semibold">My Orders</h2>
                  <Link
                    href={`/${country}/account/orders`}
                    className="text-gold-600 text-sm font-medium hover:text-gold-700"
                  >
                    View All Orders
                  </Link>
                </div>

                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">View and track your orders</p>
                  <Link
                    href={`/${country}/account/orders`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm font-medium"
                  >
                    <Package className="w-4 h-4" />
                    View Orders
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Package, label: 'Track Order', color: 'bg-blue-100 text-blue-600', href: `/${country}/account/orders` },
                    { icon: Heart, label: 'Wishlist', color: 'bg-red-100 text-red-600', href: `/${country}/wishlist` },
                    { icon: Bell, label: 'Price Alerts', color: 'bg-gold-100 text-gold-600', href: `/${country}/price-alerts` },
                    { icon: User, label: 'Edit Profile', color: 'bg-purple-100 text-purple-600', href: `/${country}/account/settings` },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-cream-50 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </Link>
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
                {profile.addresses && profile.addresses.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {(profile.addresses as Array<{ label?: string; line1?: string; city?: string; state?: string; postalCode?: string; isDefault?: boolean }>).slice(0, 2).map((addr, idx) => (
                      <div key={idx} className={`p-4 bg-cream-50 rounded-xl ${addr.isDefault ? 'border-2 border-gold-500' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">{addr.label || 'Address'}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-gold-100 text-gold-700 text-xs rounded">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {addr.line1}<br />
                          {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm mb-3">No saved addresses yet</p>
                    <Link
                      href={`/${country}/account/addresses`}
                      className="text-gold-600 text-sm font-medium hover:text-gold-700"
                    >
                      Add an address
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
