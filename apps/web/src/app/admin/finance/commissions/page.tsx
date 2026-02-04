'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  DollarSign,
  Percent,
  Store,
  PieChart,
  BarChart3,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/admin/toast';

interface CommissionEntry {
  id: string;
  orderId: string;
  sellerId: string;
  sellerName: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  category: string;
  country: string;
  createdAt: string;
  status: 'collected' | 'pending' | 'waived';
}

const MOCK_COMMISSIONS: CommissionEntry[] = [
  { id: 'COM-001', orderId: 'ORD-2024-1234', sellerId: 'SEL001', sellerName: 'Royal Jewellers', orderAmount: 85000, commissionRate: 10, commissionAmount: 8500, category: 'Necklaces', country: 'IN', createdAt: '2024-02-03T14:32:00Z', status: 'collected' },
  { id: 'COM-002', orderId: 'ORD-2024-1233', sellerId: 'SEL002', sellerName: 'Diamond Palace', orderAmount: 156000, commissionRate: 10, commissionAmount: 15600, category: 'Rings', country: 'UK', createdAt: '2024-02-03T11:00:00Z', status: 'collected' },
  { id: 'COM-003', orderId: 'ORD-2024-1232', sellerId: 'SEL003', sellerName: 'Gold Craft India', orderAmount: 45000, commissionRate: 8, commissionAmount: 3600, category: 'Earrings', country: 'IN', createdAt: '2024-02-03T10:00:00Z', status: 'pending' },
  { id: 'COM-004', orderId: 'ORD-2024-1231', sellerId: 'SEL001', sellerName: 'Royal Jewellers', orderAmount: 125000, commissionRate: 10, commissionAmount: 12500, category: 'Bangles', country: 'IN', createdAt: '2024-02-03T09:00:00Z', status: 'collected' },
  { id: 'COM-005', orderId: 'ORD-2024-1230', sellerId: 'SEL004', sellerName: 'Dubai Gold Souk', orderAmount: 78000, commissionRate: 12, commissionAmount: 9360, category: 'Necklaces', country: 'AE', createdAt: '2024-02-03T08:00:00Z', status: 'collected' },
  { id: 'COM-006', orderId: 'ORD-2024-1229', sellerId: 'SEL005', sellerName: 'Heritage Jewels', orderAmount: 92000, commissionRate: 10, commissionAmount: 0, category: 'Pendants', country: 'IN', createdAt: '2024-02-02T16:00:00Z', status: 'waived' },
];

const COMMISSION_BY_CATEGORY = [
  { category: 'Necklaces', commission: 1580000, orders: 245, rate: 10 },
  { category: 'Rings', commission: 1120000, orders: 312, rate: 10 },
  { category: 'Earrings', commission: 680000, orders: 198, rate: 8 },
  { category: 'Bangles', commission: 520000, orders: 156, rate: 10 },
  { category: 'Bracelets', commission: 380000, orders: 89, rate: 10 },
  { category: 'Pendants', commission: 240000, orders: 134, rate: 8 },
];

const COMMISSION_BY_SELLER = [
  { sellerId: 'SEL001', sellerName: 'Royal Jewellers', commission: 452000, orders: 856, country: 'IN' },
  { sellerId: 'SEL002', sellerName: 'Diamond Palace', commission: 385000, orders: 642, country: 'IN' },
  { sellerId: 'SEL003', sellerName: 'Gold Craft India', commission: 328000, orders: 521, country: 'IN' },
  { sellerId: 'SEL004', sellerName: 'Dubai Gold Souk', commission: 245000, orders: 312, country: 'AE' },
  { sellerId: 'SEL005', sellerName: 'London Fine Jewels', commission: 185000, orders: 198, country: 'UK' },
];

const statusConfig = {
  collected: { color: 'text-green-600', bg: 'bg-green-100' },
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
  waived: { color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function CommissionsPage() {
  const toast = useToast();
  const [commissions] = useState<CommissionEntry[]>(MOCK_COMMISSIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [dateRange, setDateRange] = useState('30days');

  const filteredCommissions = commissions.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (countryFilter && c.country !== countryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.orderId.toLowerCase().includes(q) ||
        c.sellerName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    totalCommission: 4520000,
    commissionChange: 15.3,
    avgRate: 9.8,
    totalOrders: 3847,
    pendingCommission: commissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0),
    waivedCommission: commissions.filter((c) => c.status === 'waived').reduce((sum, c) => sum + c.orderAmount * 0.1, 0),
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const maxCategoryCommission = Math.max(...COMMISSION_BY_CATEGORY.map((c) => c.commission));

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Finance', href: '/admin/finance' }, { label: 'Commissions' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Tracking</h1>
          <p className="text-gray-600">Monitor platform commission earnings</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => {
              const headers = ['ID', 'Order ID', 'Seller Name', 'Order Amount', 'Commission Rate', 'Commission Amount', 'Category', 'Country', 'Date', 'Status'];
              const rows = filteredCommissions.map(c => [
                c.id,
                c.orderId,
                c.sellerName,
                c.orderAmount,
                c.commissionRate,
                c.commissionAmount,
                c.category,
                c.country,
                c.createdAt,
                c.status,
              ].join(','));
              const csv = [headers.join(','), ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `commissions-export-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Commissions exported successfully');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="w-4 h-4" />
              {stats.commissionChange}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCommission)}</h3>
          <p className="text-gray-500 text-sm">Total Commission (30 days)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Percent className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.avgRate}%</h3>
          <p className="text-gray-500 text-sm">Average Commission Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingCommission)}</h3>
          <p className="text-gray-500 text-sm">Pending Collection</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-600">{formatCurrency(stats.waivedCommission)}</h3>
          <p className="text-gray-500 text-sm">Waived (Promotions)</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Commission by Category */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Commission by Category</h2>
            </div>
            <Link href="/admin/settings" className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700">
              <Settings className="w-4 h-4" />
              Configure Rates
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {COMMISSION_BY_CATEGORY.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{cat.category}</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{cat.rate}%</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(cat.commission)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.commission / maxCategoryCommission) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="bg-purple-500 h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{cat.orders} orders</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sellers by Commission */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Top Sellers</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {COMMISSION_BY_SELLER.map((seller, index) => (
              <div key={seller.sellerId} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-600 font-semibold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{seller.sellerName}</p>
                  <p className="text-xs text-gray-500">{seller.orders} orders · {seller.country}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-600">{formatCurrency(seller.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission Entries Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Status</option>
              <option value="collected">Collected</option>
              <option value="pending">Pending</option>
              <option value="waived">Waived</option>
            </select>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="">All Countries</option>
              <option value="IN">India</option>
              <option value="AE">UAE</option>
              <option value="UK">UK</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Order Amount</th>
                <th className="px-6 py-4 font-medium text-right">Rate</th>
                <th className="px-6 py-4 font-medium text-right">Commission</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.map((comm) => {
                const statusConf = statusConfig[comm.status];
                return (
                  <motion.tr
                    key={comm.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{comm.orderId}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{comm.sellerName}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{comm.category}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(comm.orderAmount)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {comm.commissionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-purple-600">
                      {comm.status === 'waived' ? (
                        <span className="text-gray-400 line-through">{formatCurrency(comm.orderAmount * 0.1)}</span>
                      ) : (
                        formatCurrency(comm.commissionAmount)
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConf.bg} ${statusConf.color}`}>
                        {comm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(comm.createdAt)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredCommissions.length} of {commissions.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 bg-gold-500 text-white rounded-lg">1</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
