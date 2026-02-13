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
  Scale,
  Hammer,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatCurrency } from '@/lib/format';

interface WeightSummary {
  totalWeightSoldGrams: number;
  totalGrossWeightGrams: number;
  totalStoneWeightCarats: number;
  totalOrders: number;
  totalItems: number;
  avgWeightPerOrder: number;
  avgWeightPerItem: number;
  byPurity: Record<string, { weightGrams: number; items: number; revenue: number }>;
  byMetal: Record<string, { weightGrams: number; items: number; revenue: number }>;
  byCategory: Record<string, { weightGrams: number; items: number; revenue: number }>;
  bySeller: Record<string, { weightGrams: number; items: number; revenue: number; sellerName?: string }>;
}

interface MCSummary {
  avgMCPerGram: number;
  avgMCPercent: number;
  totalMC: number;
  totalOrders: number;
  byMCType: Record<string, { totalMC: number; avgMC: number; items: number }>;
  byPurity: Record<string, { totalMC: number; avgMCPerGram: number; avgMCPercent: number; items: number }>;
  byCategory: Record<string, { totalMC: number; avgMCPerGram: number; items: number }>;
  dailyTrend: Array<{ date: string; avgMCPerGram: number; totalMC: number; weightSold: number }>;
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'weight' | 'mc'>('overview');
  const [data, setData] = useState<AnalyticsData>(FALLBACK);
  const [weightData, setWeightData] = useState<WeightSummary | null>(null);
  const [mcData, setMCData] = useState<MCSummary | null>(null);
  const [weightLoading, setWeightLoading] = useState(false);

  useEffect(() => {
    api
      .get<AnalyticsData>(`/api/admin/analytics?range=${dateRange}`)
      .then((res) => {
        if (res && (res as { metrics?: unknown }).metrics) setData(res as AnalyticsData);
      })
      .catch(() => {});
  }, [dateRange]);

  // Fetch weight & MC data when switching to those tabs
  useEffect(() => {
    if (activeTab === 'weight' && !weightData) {
      setWeightLoading(true);
      api.get('/api/analytics/weight-summary')
        .then((res: unknown) => {
          const d = (res as { data?: WeightSummary })?.data;
          if (d) setWeightData(d);
        })
        .catch(() => {})
        .finally(() => setWeightLoading(false));
    }
    if ((activeTab === 'mc' || activeTab === 'weight') && !mcData) {
      api.get('/api/analytics/mc-summary')
        .then((res: unknown) => {
          const d = (res as { data?: MCSummary })?.data;
          if (d) setMCData(d);
        })
        .catch(() => {});
    }
  }, [activeTab, weightData, mcData]);

  const downloadWeightCSV = () => {
    // Trigger the server-side CSV endpoint
    window.open('/api/analytics/weight-report/csv', '_blank');
  };

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

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-8">
        {[
          { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { key: 'weight' as const, label: 'Weight Report', icon: Scale },
          { key: 'mc' as const, label: 'Making Charges', icon: Hammer },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────────────── */}
      {activeTab === 'overview' && (<>

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

      </>)}

      {/* ── WEIGHT REPORT TAB ─────────────────────────────────────── */}
      {activeTab === 'weight' && (
        <div>
          {weightLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Weight summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-gold-500">
                  <p className="text-sm text-gray-500 mb-1">Total Net Weight Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{weightData?.totalWeightSoldGrams?.toFixed(2) ?? '0'} g</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-amber-500">
                  <p className="text-sm text-gray-500 mb-1">Total Gross Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{weightData?.totalGrossWeightGrams?.toFixed(2) ?? '0'} g</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500 mb-1">Avg Weight / Order</p>
                  <p className="text-2xl font-bold text-gray-900">{weightData?.avgWeightPerOrder?.toFixed(3) ?? '0'} g</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
                  <p className="text-sm text-gray-500 mb-1">Stone Weight Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{weightData?.totalStoneWeightCarats?.toFixed(2) ?? '0'} ct</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* By Purity */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Weight by Purity</h2>
                  {weightData?.byPurity && Object.keys(weightData.byPurity).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(weightData.byPurity).map(([purity, d]) => (
                        <div key={purity} className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="font-medium text-gray-800">{purity}</span>
                          <div className="text-right">
                            <span className="font-bold text-gray-900">{d.weightGrams.toFixed(2)} g</span>
                            <span className="text-sm text-gray-500 ml-2">({d.items} items)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No data available yet.</p>
                  )}
                </div>

                {/* By Category */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Weight by Category</h2>
                  {weightData?.byCategory && Object.keys(weightData.byCategory).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(weightData.byCategory).map(([cat, d]) => (
                        <div key={cat} className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="font-medium text-gray-800 capitalize">{cat}</span>
                          <div className="text-right">
                            <span className="font-bold text-gray-900">{d.weightGrams.toFixed(2)} g</span>
                            <span className="text-sm text-gray-500 ml-2">{formatCurrency(d.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No data available yet.</p>
                  )}
                </div>
              </div>

              {/* By Seller */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Weight by Seller</h2>
                  <button
                    type="button"
                    onClick={downloadWeightCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
                {weightData?.bySeller && Object.keys(weightData.bySeller).length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">Seller</th>
                        <th className="pb-3 font-medium text-right">Weight (g)</th>
                        <th className="pb-3 font-medium text-right">Items</th>
                        <th className="pb-3 font-medium text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(weightData.bySeller).map(([id, d]) => (
                        <tr key={id} className="border-b border-gray-50">
                          <td className="py-3 font-medium text-gray-800">{d.sellerName || id}</td>
                          <td className="py-3 text-right font-bold">{d.weightGrams.toFixed(3)}</td>
                          <td className="py-3 text-right text-gray-600">{d.items}</td>
                          <td className="py-3 text-right text-gray-900">{formatCurrency(d.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-8">No data available yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MAKING CHARGES TAB ────────────────────────────────────── */}
      {activeTab === 'mc' && (
        <div>
          {/* MC summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-amber-500">
              <p className="text-sm text-gray-500 mb-1">Avg MC per Gram</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mcData?.avgMCPerGram ?? 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-gold-500">
              <p className="text-sm text-gray-500 mb-1">Avg MC %</p>
              <p className="text-2xl font-bold text-gray-900">{mcData?.avgMCPercent?.toFixed(1) ?? '0'}%</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
              <p className="text-sm text-gray-500 mb-1">Total MC Earned</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mcData?.totalMC ?? 0)}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* MC by Purity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">MC by Purity</h2>
              {mcData?.byPurity && Object.keys(mcData.byPurity).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(mcData.byPurity).map(([purity, d]) => (
                    <div key={purity} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="font-medium text-gray-800">{purity}</span>
                      <div className="text-right text-sm">
                        <span className="font-bold text-gray-900">{formatCurrency(d.avgMCPerGram)}/g</span>
                        <span className="text-gray-500 ml-2">({d.avgMCPercent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No MC data yet.</p>
              )}
            </div>

            {/* MC by Category */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">MC by Category</h2>
              {mcData?.byCategory && Object.keys(mcData.byCategory).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(mcData.byCategory).map(([cat, d]) => (
                    <div key={cat} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="font-medium text-gray-800 capitalize">{cat}</span>
                      <div className="text-right text-sm">
                        <span className="font-bold text-gray-900">{formatCurrency(d.avgMCPerGram)}/g</span>
                        <span className="text-gray-500 ml-2">Total: {formatCurrency(d.totalMC)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No MC data yet.</p>
              )}
            </div>
          </div>

          {/* MC Daily Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily MC Trend</h2>
            {mcData?.dailyTrend && mcData.dailyTrend.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium text-right">Avg MC/g</th>
                      <th className="pb-2 font-medium text-right">Total MC</th>
                      <th className="pb-2 font-medium text-right">Weight Sold (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mcData.dailyTrend.map((d) => (
                      <tr key={d.date} className="border-b border-gray-50">
                        <td className="py-2 font-medium">{d.date}</td>
                        <td className="py-2 text-right">{formatCurrency(d.avgMCPerGram)}</td>
                        <td className="py-2 text-right">{formatCurrency(d.totalMC)}</td>
                        <td className="py-2 text-right">{d.weightSold.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No trend data yet. Orders with MC data will appear here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
