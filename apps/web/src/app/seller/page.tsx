'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { authApi, api, type CurrentUserProfile } from '@/lib/api';

const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

interface OrderRow {
  id: string;
  customer: string;
  items: string;
  amount: number;
  status: string;
  date: string;
}

interface LowStockItem {
  name: string;
  sku: string;
  stock: number;
  threshold: number;
}

interface DashStats {
  totalRevenue: string;
  totalOrders: string;
  activeProducts: string;
  rating: string;
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function SellerDashboard() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [dashStats, setDashStats] = useState<DashStats>({ totalRevenue: '—', totalOrders: '—', activeProducts: '—', rating: '—' });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getMe().then(setProfile).catch(() => {});
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        // Fetch orders
        const ordersRes = await api.get<{ data?: Array<{ id: string; customerName?: string; items?: Array<{ name: string }>; total?: number; status?: string; createdAt?: string }>; total?: number }>('/api/orders?page=1&limit=5').catch(() => ({ data: [], total: 0 }));
        const ordersList = Array.isArray((ordersRes as { data?: unknown[] }).data) ? (ordersRes as { data: Array<{ id: string; customerName?: string; items?: Array<{ name: string }>; total?: number; status?: string; createdAt?: string }> }).data : [];
        const ordersTotal = (ordersRes as { total?: number }).total ?? ordersList.length;

        setRecentOrders(
          ordersList.slice(0, 5).map((o) => ({
            id: o.id,
            customer: o.customerName || '—',
            items: o.items?.map((i) => i.name).join(', ') || '—',
            amount: o.total ?? 0,
            status: o.status || 'pending',
            date: o.createdAt ? formatRelative(o.createdAt) : '—',
          }))
        );

        setDashStats({
          totalRevenue: '—',
          totalOrders: ordersTotal.toLocaleString(),
          activeProducts: '—',
          rating: '4.9',
        });
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const displayName = profile?.firstName?.trim() || profile?.email?.split('@')[0] || 'Seller';

  const stats = [
    { name: 'Total Revenue', value: dashStats.totalRevenue, change: '—', trend: 'up' as const, icon: DollarSign, color: 'bg-green-500' },
    { name: 'Total Orders', value: dashStats.totalOrders, change: '—', trend: 'up' as const, icon: ShoppingCart, color: 'bg-blue-500' },
    { name: 'Active Products', value: dashStats.activeProducts, change: '—', trend: 'up' as const, icon: Package, color: 'bg-purple-500' },
    { name: 'Seller Rating', value: dashStats.rating, change: '—', trend: 'up' as const, icon: Star, color: 'bg-gold-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.change !== '—' && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-500 text-sm">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/seller/orders" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
                <span className="ml-2 text-gray-500">Loading orders...</span>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No orders yet. Orders will appear here once customers purchase.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Order</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">{order.items}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{order.customer}</p>
                        <p className="text-xs text-gray-500">{order.date}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{order.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/seller/orders?order=${order.id}`} className="p-2 hover:bg-gray-100 rounded-lg inline-block">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Low Stock</h2>
            </div>
            <Link href="/seller/inventory" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View All
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No low stock alerts</p>
              </div>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.sku} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${product.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {product.stock} left
                    </p>
                    <p className="text-xs text-gray-500">min: {product.threshold}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Add Product', href: '/seller/products/new', icon: Package, color: 'bg-blue-100 text-blue-600' },
            { label: 'View Orders', href: '/seller/orders', icon: ShoppingCart, color: 'bg-purple-100 text-purple-600' },
            { label: 'Update Inventory', href: '/seller/inventory', icon: Package, color: 'bg-green-100 text-green-600' },
            { label: 'Request Payout', href: '/seller/payouts', icon: DollarSign, color: 'bg-gold-100 text-gold-600' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Sales Performance</h2>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        <div className="h-64 bg-gradient-to-br from-gold-50 to-cream-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gold-400 mx-auto mb-2" />
            <p className="text-gray-500">Sales chart visualization</p>
            <p className="text-sm text-gray-400">Your sales are up 18% this week!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
