'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ShieldCheck,
  Receipt,
  UserPlus,
  AlertTriangle,
  Globe,
  MapPin,
  Crown,
  Building2,
  Activity,
  ChevronRight,
  UserCog,
  Zap,
} from 'lucide-react';
import { adminApi, api } from '@/lib/api';
import { formatRelativeDate, formatCurrency } from '@/lib/format';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/admin/skeleton';

const COUNTRIES = ['IN', 'AE', 'UK'] as const;
type Country = (typeof COUNTRIES)[number];

const COUNTRY_INFO: Record<Country, { name: string; flag: string; currency: string }> = {
  IN: { name: 'India', flag: '🇮🇳', currency: 'INR' },
  AE: { name: 'UAE', flag: '🇦🇪', currency: 'AED' },
  UK: { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
};

const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

interface OrderRow {
  id: string;
  customer?: string;
  amount?: number;
  status?: string;
  date?: string;
  createdAt?: string;
  country?: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  pendingKyc: number;
  pendingRefunds: number;
  pendingOnboarding: number;
  lowStockCount: number;
}

interface CountryStats {
  country: Country;
  orders: number;
  users: number;
  revenue: number;
  pendingOnboarding: number;
}

interface CountryAdmin {
  id: string;
  name: string;
  email: string;
  country: Country;
  lastActive?: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<{ firstName?: string; email?: string; role?: string; country?: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [countryStatsLoading, setCountryStatsLoading] = useState(true);
  const [countryAdmins, setCountryAdmins] = useState<CountryAdmin[]>([]);
  const [countryAdminsLoading, setCountryAdminsLoading] = useState(true);
  const [topSellers, setTopSellers] = useState<Array<{ name: string; sales: string; orders: number; rating: number }>>([]);
  const [liveGoldRates, setLiveGoldRates] = useState<{ gold: Record<string, number>; provider: string; pricingMode?: string; updatedAt: string | null } | null>(null);

  const isSuperAdmin = profile?.role === 'super_admin';
  const country = profile?.role === 'country_admin' && profile?.country ? profile.country : undefined;

  useEffect(() => {
    adminApi.getMe().then(setProfile).catch(() => {});
  }, []);

  // Fetch global stats
  useEffect(() => {
    if (!profile) return;
    setStatsLoading(true);
    Promise.all([
      adminApi.getOrders({ limit: 1, country }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getUsers({ limit: 1, country }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getProducts({ limit: 1 }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getKycPending({ limit: 1 }).then((r: unknown) => (r as { total?: number; applications?: unknown[] }).total ?? (r as { applications?: unknown[] }).applications?.length ?? 0),
      adminApi.getRefundsPending({ limit: 1 }).then((r: unknown) => (r as { total?: number }).total ?? (r as { data?: unknown[] }).data?.length ?? 0),
      adminApi.getOnboardingPending({ limit: 1, country }).then((r: unknown) => (r as { total?: number }).total ?? (r as { data?: unknown[] }).data?.length ?? 0),
      api.get<{ metrics?: { totalRevenue?: number; revenueChange?: number; ordersChange?: number } }>('/api/admin/analytics?range=30days').then((res: unknown) => (res as { metrics?: { totalRevenue?: number; revenueChange?: number; ordersChange?: number } })?.metrics ?? {}).catch(() => ({})),
      adminApi.getProducts({ limit: 100, status: 'low_stock' }).then((r: unknown) => (r as { data?: unknown[] }).data?.length ?? 0).catch(() => 0),
    ])
      .then(([ordersTotal, usersTotal, productsTotal, pendingKyc, pendingRefunds, pendingOnboarding, metrics, lowStockCount]) => {
        setStats({
          totalRevenue: (metrics as { totalRevenue?: number }).totalRevenue ?? 0,
          totalOrders: ordersTotal,
          totalUsers: usersTotal,
          totalProducts: productsTotal,
          revenueChange: (metrics as { revenueChange?: number }).revenueChange ?? 0,
          ordersChange: (metrics as { ordersChange?: number }).ordersChange ?? 0,
          pendingKyc,
          pendingRefunds,
          pendingOnboarding,
          lowStockCount,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [profile, country]);

  // Fetch per-country stats (Super Admin only)
  useEffect(() => {
    if (!profile || !isSuperAdmin) {
      setCountryStatsLoading(false);
      return;
    }
    setCountryStatsLoading(true);
    Promise.all(
      COUNTRIES.map(async (c) => {
        const [ordersRes, usersRes, onboardingRes] = await Promise.all([
          adminApi.getOrders({ limit: 1, country: c }).catch(() => ({ total: 0 })),
          adminApi.getUsers({ limit: 1, country: c }).catch(() => ({ total: 0 })),
          adminApi.getOnboardingPending({ limit: 1, country: c }).catch(() => ({ total: 0 })),
        ]);
        return {
          country: c,
          orders: (ordersRes as { total?: number }).total ?? 0,
          users: (usersRes as { total?: number }).total ?? 0,
          revenue: 0, // Would need dedicated analytics endpoint
          pendingOnboarding: (onboardingRes as { total?: number }).total ?? 0,
        };
      })
    )
      .then(setCountryStats)
      .catch(() => setCountryStats([]))
      .finally(() => setCountryStatsLoading(false));
  }, [profile, isSuperAdmin]);

  // Fetch country admins (Super Admin only)
  useEffect(() => {
    if (!profile || !isSuperAdmin) {
      setCountryAdminsLoading(false);
      return;
    }
    setCountryAdminsLoading(true);
    adminApi
      .getUsers({ limit: 50, role: 'country_admin' })
      .then((res) => {
        const d = res as { users?: Array<{ id: string; firstName?: string; lastName?: string; email: string; country: Country; lastLoginAt?: string }> };
        const list = Array.isArray(d?.users) ? d.users : [];
        setCountryAdmins(
          list.map((u) => ({
            id: u.id,
            name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email.split('@')[0],
            email: u.email,
            country: u.country,
            lastActive: u.lastLoginAt ? formatRelativeDate(u.lastLoginAt) : undefined,
          }))
        );
      })
      .catch(() => setCountryAdmins([]))
      .finally(() => setCountryAdminsLoading(false));
  }, [profile, isSuperAdmin]);

  // Fetch live gold rates
  useEffect(() => {
    fetch('/api/rates/metals')
      .then((r) => r.json())
      .then((data) => setLiveGoldRates(data))
      .catch(() => {});
  }, []);

  // Fetch recent orders
  useEffect(() => {
    if (!profile) return;
    adminApi
      .getOrders({ limit: 5, country })
      .then((res) => {
        const d = res as { data?: Array<{ id?: string; customerName?: string; total?: number; status?: string; createdAt?: string; country?: string }> };
        const list = Array.isArray(d?.data) ? d.data : [];
        setRecentOrders(
          list.map((o) => ({
            id: o.id ?? '',
            customer: o.customerName ?? '—',
            amount: o.total ?? 0,
            status: o.status ?? 'pending',
            date: o.createdAt ? formatRelativeDate(o.createdAt) : '—',
            createdAt: o.createdAt,
            country: o.country,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [profile, country]);

  const greeting = getGreeting();
  const displayName = profile?.firstName?.trim() || profile?.email?.split('@')[0] || 'Admin';

  const quickActions = [
    { label: 'Pending KYC', count: stats?.pendingKyc ?? 0, href: '/admin/kyc', icon: ShieldCheck, color: 'bg-amber-100 text-amber-800' },
    { label: 'Refund Requests', count: stats?.pendingRefunds ?? 0, href: '/admin/refunds', icon: Receipt, color: 'bg-blue-100 text-blue-800' },
    { label: 'Seller Onboarding', count: stats?.pendingOnboarding ?? 0, href: '/admin/onboarding', icon: UserPlus, color: 'bg-purple-100 text-purple-800' },
    { label: 'Low Stock', count: stats?.lowStockCount ?? 0, href: '/admin/products?status=low_stock', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
  ];

  const statCards: Array<{
    name: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = stats
    ? [
        { name: 'Total Revenue', value: formatCurrency(stats.totalRevenue), change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange}%`, trend: stats.revenueChange >= 0 ? 'up' : 'down', icon: DollarSign, color: 'bg-green-500' },
        { name: 'Total Orders', value: stats.totalOrders.toLocaleString(), change: `${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange}%`, trend: stats.ordersChange >= 0 ? 'up' : 'down', icon: ShoppingCart, color: 'bg-blue-500' },
        { name: 'Total Users', value: stats.totalUsers.toLocaleString(), change: '+0%', trend: 'up', icon: Users, color: 'bg-purple-500' },
        { name: 'Active Products', value: stats.totalProducts.toLocaleString(), change: stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : 'OK', trend: stats.lowStockCount > 0 ? 'down' : 'up', icon: Package, color: 'bg-orange-500' },
      ]
    : [];

  return (
    <div>
      {/* Header with role indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-xs font-semibold rounded-full shadow-sm">
              <Crown className="w-3.5 h-3.5" />
              SUPER ADMIN
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-full">
              <MapPin className="w-3.5 h-3.5" />
              {profile?.country} ADMIN
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {displayName}</h1>
        <p className="text-gray-600">
          {isSuperAdmin
            ? 'Global overview across all countries and operations.'
            : `Here's what's happening in ${profile?.country ?? 'your region'}.`}
        </p>
      </div>

      {/* Super Admin: Global Overview Banner */}
      {isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-burgundy-900 via-burgundy-800 to-burgundy-900 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-gold-400" />
            <div>
              <h2 className="text-lg font-bold">Global Command Center</h2>
              <p className="text-burgundy-200 text-sm">Managing operations across {COUNTRIES.length} countries</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {COUNTRIES.map((c) => {
              const info = COUNTRY_INFO[c];
              const cStats = countryStats.find((s) => s.country === c);
              return (
                <Link
                  key={c}
                  href={`/admin/users?country=${c}`}
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{info.flag}</span>
                    <span className="font-semibold">{info.name}</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {countryStatsLoading ? (
                    <div className="space-y-1">
                      <div className="h-4 bg-white/20 rounded animate-pulse w-20" />
                      <div className="h-3 bg-white/10 rounded animate-pulse w-16" />
                    </div>
                  ) : (
                    <div className="text-sm text-burgundy-200">
                      <span className="text-white font-medium">{cStats?.orders ?? 0}</span> orders · <span className="text-white font-medium">{cStats?.users ?? 0}</span> users
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick action badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${action.color} hover:opacity-90 transition-opacity`}
          >
            <action.icon className="h-4 w-4" />
            <span>{action.label}</span>
            {action.count > 0 && (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">{action.count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Live Gold Rates Card */}
      {liveGoldRates && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-amber-50 to-gold-50 border border-amber-200 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-gray-900">Live Gold Rates (24K/g)</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                liveGoldRates.pricingMode === 'manual' ? 'bg-amber-200 text-amber-800' :
                liveGoldRates.pricingMode === 'mixed' ? 'bg-blue-200 text-blue-800' :
                'bg-green-200 text-green-800'
              }`}>
                {liveGoldRates.pricingMode || liveGoldRates.provider}
              </span>
            </div>
            <Link
              href="/admin/pricing"
              className="text-sm text-gold-600 hover:text-gold-700 font-medium"
            >
              Manage Pricing
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { flag: '🇮🇳', code: 'INR', symbol: '₹', name: 'India' },
              { flag: '🇦🇪', code: 'AED', symbol: 'AED ', name: 'UAE' },
              { flag: '🇬🇧', code: 'GBP', symbol: '£', name: 'UK' },
            ].map((c) => (
              <div key={c.code} className="flex items-center gap-2">
                <span className="text-lg">{c.flag}</span>
                <span className="font-bold text-gray-900">
                  {c.symbol}
                  {liveGoldRates.gold[c.code] != null
                    ? liveGoldRates.gold[c.code] >= 1000
                      ? liveGoldRates.gold[c.code].toLocaleString('en-IN')
                      : liveGoldRates.gold[c.code].toFixed(2)
                    : '—'}
                </span>
              </div>
            ))}
          </div>
          {liveGoldRates.updatedAt && (
            <p className="text-xs text-gray-400 mt-2">
              Updated: {new Date(liveGoldRates.updatedAt).toLocaleString()}
            </p>
          )}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-gray-500 text-sm">{stat.name}</p>
              </motion.div>
            ))}
      </div>

      {/* Super Admin: Country Admins Section */}
      {isSuperAdmin && (
        <div className="mb-8 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                <UserCog className="w-5 h-5 text-gold-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Country Admins</h2>
                <p className="text-sm text-gray-500">Manage administrators for each country</p>
              </div>
            </div>
            <Link href="/admin/users?role=country_admin" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              Manage All
            </Link>
          </div>
          <div className="p-6">
            {countryAdminsLoading ? (
              <div className="grid md:grid-cols-3 gap-4">
                {COUNTRIES.map((c) => (
                  <div key={c} className="border border-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-32" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {COUNTRIES.map((c) => {
                  const info = COUNTRY_INFO[c];
                  const admins = countryAdmins.filter((a) => a.country === c);
                  return (
                    <div key={c} className="border border-gray-100 rounded-lg p-4 hover:border-gold-200 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{info.flag}</span>
                        <span className="font-semibold text-gray-900">{info.name}</span>
                      </div>
                      {admins.length === 0 ? (
                        <div className="text-sm text-gray-500">
                          <p className="mb-2">No admin assigned</p>
                          <Link
                            href={`/admin/users?country=${c}`}
                            className="inline-flex items-center gap-1 text-gold-600 hover:text-gold-700 font-medium"
                          >
                            <UserPlus className="w-4 h-4" />
                            Assign Admin
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {admins.slice(0, 2).map((admin) => (
                            <div key={admin.id} className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {admin.name[0]?.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
                                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                              </div>
                            </div>
                          ))}
                          {admins.length > 2 && (
                            <p className="text-xs text-gray-500">+{admins.length - 2} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Super Admin: Country-wise Stats Table */}
      {isSuperAdmin && (
        <div className="mb-8 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Country Performance</h2>
                <p className="text-sm text-gray-500">Compare metrics across all regions</p>
              </div>
            </div>
            <Link href="/admin/reports" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View Reports
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Country</th>
                  <th className="px-6 py-4 font-medium text-right">Orders</th>
                  <th className="px-6 py-4 font-medium text-right">Users</th>
                  <th className="px-6 py-4 font-medium text-right">Pending Sellers</th>
                  <th className="px-6 py-4 font-medium">Admin Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {countryStatsLoading ? (
                  COUNTRIES.map((c) => (
                    <tr key={c} className="border-b border-gray-50">
                      <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded w-24 animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded w-12 ml-auto animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded w-12 ml-auto animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded w-12 ml-auto animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded w-20 animate-pulse" /></td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))
                ) : (
                  countryStats.map((cs) => {
                    const info = COUNTRY_INFO[cs.country];
                    const hasAdmin = countryAdmins.some((a) => a.country === cs.country);
                    return (
                      <tr key={cs.country} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{info.flag}</span>
                            <span className="font-medium text-gray-900">{info.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">{cs.orders.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">{cs.users.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          {cs.pendingOnboarding > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              {cs.pendingOnboarding}
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {hasAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <Building2 className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                              No Admin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/users?country=${cs.country}`}
                            className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Orders {isSuperAdmin && <span className="text-sm font-normal text-gray-500">(All Countries)</span>}
            </h2>
            <Link href="/admin/orders" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {ordersLoading ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    {isSuperAdmin && <th className="px-6 py-4 font-medium">Country</th>}
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={isSuperAdmin ? 7 : 6} />
                  ))}
                </tbody>
              </table>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent orders.</p>
                <Link href="/admin/orders" className="mt-2 inline-block text-sm text-gold-600 hover:text-gold-700">View all orders</Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    {isSuperAdmin && <th className="px-6 py-4 font-medium">Country</th>}
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 text-gray-600">{order.customer ?? '—'}</td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4">
                          {order.country && COUNTRY_INFO[order.country as Country] ? (
                            <span className="inline-flex items-center gap-1">
                              <span>{COUNTRY_INFO[order.country as Country].flag}</span>
                              <span className="text-gray-600">{order.country}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(order.amount ?? 0)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status ?? ''] ?? 'bg-gray-100 text-gray-700'}`}>
                          {order.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{order.date ?? '—'}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/orders?order=${order.id}`} className="p-1 hover:bg-gray-100 rounded inline-block">
                          <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Top Sellers</h2>
            <Link href="/admin/sellers" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View All
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {topSellers.length === 0 && (
              <>
                {['Royal Jewellers', 'Diamond Palace', 'Gold Craft India', 'Heritage Jewels'].map((name, i) => (
                  <div key={name} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gold-600 font-semibold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{name}</p>
                      <p className="text-sm text-gray-500">—</p>
                    </div>
                  </div>
                ))}
              </>
            )}
            {topSellers.map((seller, index) => (
              <div key={seller.name} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-600 font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{seller.name}</p>
                  <p className="text-sm text-gray-500">{seller.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{seller.sales}</p>
                  <p className="text-sm text-gray-500">* {seller.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
          <Link href="/admin/reports" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
            View in Reports
          </Link>
        </div>
        <div className="h-64 bg-gradient-to-br from-gold-50 to-cream-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gold-400 mx-auto mb-2" />
            <p className="text-gray-500">Revenue chart in Reports</p>
            <Link href="/admin/reports" className="text-sm text-gold-600 hover:text-gold-700">Open Reports →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
