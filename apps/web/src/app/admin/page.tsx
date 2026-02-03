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
} from 'lucide-react';
import { adminApi, api } from '@/lib/api';
import { formatRelativeDate, formatCurrency } from '@/lib/format';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/admin/skeleton';

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
  const [topSellers, setTopSellers] = useState<Array<{ name: string; sales: string; orders: number; rating: number }>>([]);

  const country = profile?.role === 'country_admin' && profile?.country ? profile.country : undefined;

  useEffect(() => {
    adminApi.getMe().then(setProfile).catch(() => {});
  }, []);

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

  useEffect(() => {
    adminApi
      .getMe()
      .then((me) => {
        const c = me?.role === 'country_admin' && me?.country ? me.country : undefined;
        return adminApi.getOrders({ limit: 5, country: c });
      })
      .then((res) => {
        const d = res as { data?: Array<{ id?: string; customerName?: string; total?: number; status?: string; createdAt?: string }> };
        const list = Array.isArray(d?.data) ? d.data : [];
        setRecentOrders(
          list.map((o) => ({
            id: o.id ?? '',
            customer: o.customerName ?? '—',
            amount: o.total ?? 0,
            status: o.status ?? 'pending',
            date: o.createdAt ? formatRelativeDate(o.createdAt) : '—',
            createdAt: o.createdAt,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {displayName}</h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your store.</p>
      </div>

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

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
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
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
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
                  <p className="text-sm text-gray-500">⭐ {seller.rating}</p>
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
