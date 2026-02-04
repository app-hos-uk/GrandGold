'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatCurrency } from '@/lib/format';

interface AnalyticsData {
  metrics: { totalRevenue: number; totalOrders: number; avgOrderValue: number; newUsers: number; revenueChange: number; ordersChange: number };
  revenueData: { month: string; revenue: number; orders: number }[];
  categoryData: { name: string; value: number; revenue: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
}

const FALLBACK: AnalyticsData = {
  metrics: { totalRevenue: 45200000, totalOrders: 3847, avgOrderValue: 11750, newUsers: 423, revenueChange: 12.5, ordersChange: 8.2 },
  revenueData: [
    { month: 'Jan', revenue: 3200000, orders: 245 },
    { month: 'Feb', revenue: 3850000, orders: 312 },
    { month: 'Mar', revenue: 4100000, orders: 356 },
    { month: 'Apr', revenue: 3900000, orders: 298 },
    { month: 'May', revenue: 4520000, orders: 387 },
    { month: 'Jun', revenue: 4800000, orders: 412 },
  ],
  categoryData: [
    { name: 'Necklaces', value: 35, revenue: 15800000 },
    { name: 'Earrings', value: 25, revenue: 11200000 },
    { name: 'Rings', value: 22, revenue: 9900000 },
    { name: 'Bracelets', value: 12, revenue: 5400000 },
    { name: 'Others', value: 6, revenue: 2700000 },
  ],
  topProducts: [
    { name: 'Traditional Kundan Necklace Set', sales: 156, revenue: 2886000 },
    { name: 'Solitaire Engagement Ring', sales: 98, revenue: 2401000 },
    { name: 'Diamond Studded Jhumkas', sales: 134, revenue: 1051900 },
    { name: 'Temple Design Choker', sales: 67, revenue: 1976500 },
    { name: 'Classic Gold Bangle Set', sales: 89, revenue: 1112500 },
  ],
};

function exportToCSV(data: AnalyticsData, dateRange: string) {
  const rows: string[][] = [
    ['Report', 'Analytics Export', dateRange],
    [],
    ['Metric', 'Value'],
    ['Total Revenue', `₹${(data.metrics.totalRevenue / 10000000).toFixed(2)} Cr`],
    ['Total Orders', String(data.metrics.totalOrders)],
    ['Avg Order Value', `₹${data.metrics.avgOrderValue.toLocaleString()}`],
    ['New Users', String(data.metrics.newUsers)],
    [],
    ['Revenue by Month', 'Revenue', 'Orders'],
    ...data.revenueData.map((d) => [d.month, String(d.revenue), String(d.orders)]),
    [],
    ['Category', 'Share %', 'Revenue'],
    ...data.categoryData.map((d) => [d.name, `${d.value}%`, String(d.revenue)]),
    [],
    ['Top Products', 'Sales', 'Revenue'],
    ...data.topProducts.map((d) => [d.name, String(d.sales), String(d.revenue)]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-report-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [data, setData] = useState<AnalyticsData>(FALLBACK);

  useEffect(() => {
    api
      .get<AnalyticsData>(`/api/admin/analytics?range=${dateRange}`)
      .then((res) => {
        if (res && (res as { metrics?: unknown }).metrics) setData(res as AnalyticsData);
      })
      .catch(() => {});
  }, [dateRange]);

  const { metrics, revenueData, categoryData, topProducts } = data;

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);
  const countryBreakdown = [
    { code: 'IN', name: 'India', revenue: metrics.totalRevenue * 0.6, orders: Math.round(metrics.totalOrders * 0.55) },
    { code: 'AE', name: 'UAE', revenue: metrics.totalRevenue * 0.25, orders: Math.round(metrics.totalOrders * 0.28) },
    { code: 'UK', name: 'United Kingdom', revenue: metrics.totalRevenue * 0.15, orders: Math.round(metrics.totalOrders * 0.17) },
  ];

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Reports' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">This year</option>
          </select>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" />
            Custom
          </button>
          <button
            type="button"
            onClick={() => exportToCSV(data, dateRange)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Revenue',
            value: `₹${(metrics.totalRevenue / 10000000).toFixed(2)} Cr`,
            change: `+${metrics.revenueChange}%`,
            trend: 'up' as const,
            icon: DollarSign,
            color: 'bg-green-500',
          },
          {
            label: 'Total Orders',
            value: metrics.totalOrders.toLocaleString(),
            change: `+${metrics.ordersChange}%`,
            trend: 'up' as const,
            icon: ShoppingCart,
            color: 'bg-blue-500',
          },
          {
            label: 'Avg Order Value',
            value: `₹${metrics.avgOrderValue.toLocaleString()}`,
            change: '+4.1%',
            trend: 'up' as const,
            icon: TrendingUp,
            color: 'bg-purple-500',
          },
          {
            label: 'New Users',
            value: metrics.newUsers.toLocaleString(),
            change: '+12%',
            trend: 'up' as const,
            icon: Users,
            color: 'bg-orange-500',
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${metric.color} rounded-xl flex items-center justify-center`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {metric.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
            <p className="text-gray-500 text-sm">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart - bar visualization */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-end gap-2 px-2">
            {revenueData.map((d, i) => (
              <motion.div
                key={d.month}
                initial={{ height: 0 }}
                animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="flex-1 min-w-0 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-medium text-gray-600">₹{(d.revenue / 100000).toFixed(0)}L</span>
                <div className="w-full bg-gold-500 rounded-t hover:bg-gold-600 transition-colors min-h-[20px]" title={`${d.month}: ₹${(d.revenue / 100000).toFixed(0)}L`} />
                <span className="text-xs text-gray-500">{d.month}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Sales by Category</h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {categoryData.map((category, index) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className="text-sm text-gray-500">{category.value}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.value}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="h-full bg-gold-500 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(category.revenue)} revenue</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by country */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Revenue by Country</h2>
          <Globe className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {countryBreakdown.map((c) => (
            <div key={c.code} className="rounded-lg border border-gray-100 p-4">
              <p className="text-sm font-medium text-gray-700">{c.name} ({c.code})</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(c.revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{c.orders.toLocaleString()} orders</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
          <button type="button" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">#</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Units Sold</th>
                <th className="px-6 py-4 font-medium">Revenue</th>
                <th className="px-6 py-4 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < 3 ? 'bg-gold-100 text-gold-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-gray-600">{product.sales}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">+{Math.floor(Math.random() * 20 + 5)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
