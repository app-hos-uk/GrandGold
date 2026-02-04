'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Users,
  Calendar,
  ChevronRight,
  PieChart,
  BarChart3,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatCurrency } from '@/lib/format';

interface FinanceStats {
  totalRevenue: number;
  revenueChange: number;
  totalTransactions: number;
  transactionsChange: number;
  pendingPayouts: number;
  pendingPayoutsCount: number;
  totalCommission: number;
  commissionChange: number;
  avgTransactionValue: number;
  refundsProcessed: number;
  refundAmount: number;
  platformBalance: number;
}

const MOCK_STATS: FinanceStats = {
  totalRevenue: 45200000,
  revenueChange: 12.5,
  totalTransactions: 3847,
  transactionsChange: 8.2,
  pendingPayouts: 2850000,
  pendingPayoutsCount: 24,
  totalCommission: 4520000,
  commissionChange: 15.3,
  avgTransactionValue: 11750,
  refundsProcessed: 156,
  refundAmount: 1820000,
  platformBalance: 8750000,
};

interface RecentTransaction {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'commission';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  date: string;
  country: string;
}

const MOCK_TRANSACTIONS: RecentTransaction[] = [
  { id: 'TXN001', type: 'payment', amount: 85000, status: 'completed', description: 'Order #ORD-2024-1234', date: '2 min ago', country: 'IN' },
  { id: 'TXN002', type: 'commission', amount: 8500, status: 'completed', description: 'Commission from Royal Jewellers', date: '15 min ago', country: 'IN' },
  { id: 'TXN003', type: 'payout', amount: 125000, status: 'pending', description: 'Payout to Diamond Palace', date: '1 hour ago', country: 'IN' },
  { id: 'TXN004', type: 'refund', amount: 42000, status: 'completed', description: 'Refund for Order #ORD-2024-1198', date: '2 hours ago', country: 'AE' },
  { id: 'TXN005', type: 'payment', amount: 156000, status: 'completed', description: 'Order #ORD-2024-1233', date: '3 hours ago', country: 'UK' },
];

interface PendingPayout {
  id: string;
  sellerName: string;
  amount: number;
  ordersCount: number;
  periodEnd: string;
  status: 'ready' | 'processing' | 'on_hold';
}

const MOCK_PAYOUTS: PendingPayout[] = [
  { id: 'SET001', sellerName: 'Royal Jewellers', amount: 485000, ordersCount: 42, periodEnd: 'Feb 3, 2024', status: 'ready' },
  { id: 'SET002', sellerName: 'Diamond Palace', amount: 325000, ordersCount: 28, periodEnd: 'Feb 3, 2024', status: 'ready' },
  { id: 'SET003', sellerName: 'Gold Craft India', amount: 198000, ordersCount: 15, periodEnd: 'Feb 3, 2024', status: 'processing' },
  { id: 'SET004', sellerName: 'Heritage Jewels', amount: 156000, ordersCount: 12, periodEnd: 'Feb 2, 2024', status: 'on_hold' },
];

const COUNTRY_REVENUE = [
  { country: 'IN', name: 'India', flag: '🇮🇳', revenue: 27120000, percentage: 60, transactions: 2115 },
  { country: 'AE', name: 'UAE', flag: '🇦🇪', revenue: 11300000, percentage: 25, transactions: 1077 },
  { country: 'UK', name: 'UK', flag: '🇬🇧', revenue: 6780000, percentage: 15, transactions: 655 },
];

const typeConfig = {
  payment: { color: 'text-green-600', bg: 'bg-green-100', icon: ArrowUpRight, label: 'Payment' },
  refund: { color: 'text-red-600', bg: 'bg-red-100', icon: ArrowDownRight, label: 'Refund' },
  payout: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Building, label: 'Payout' },
  commission: { color: 'text-purple-600', bg: 'bg-purple-100', icon: DollarSign, label: 'Commission' },
};

const statusConfig = {
  completed: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
  failed: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
};

const payoutStatusConfig = {
  ready: { color: 'text-green-600', bg: 'bg-green-100', label: 'Ready to Pay' },
  processing: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Processing' },
  on_hold: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'On Hold' },
};

export default function FinanceDashboard() {
  const [stats] = useState<FinanceStats>(MOCK_STATS);
  const [transactions] = useState<RecentTransaction[]>(MOCK_TRANSACTIONS);
  const [payouts] = useState<PendingPayout[]>(MOCK_PAYOUTS);
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Finance' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600">Overview of platform financial health</p>
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
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {stats.revenueChange}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</h3>
          <p className="text-gray-500 text-sm">Total Revenue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.commissionChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.commissionChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {stats.commissionChange}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCommission)}</h3>
          <p className="text-gray-500 text-sm">Platform Commission</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">{stats.pendingPayoutsCount} sellers</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingPayouts)}</h3>
          <p className="text-gray-500 text-sm">Pending Payouts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-gold-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.transactionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.transactionsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {stats.transactionsChange}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</h3>
          <p className="text-gray-500 text-sm">Total Transactions</p>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.avgTransactionValue)}</p>
            <p className="text-sm text-gray-500">Avg. Transaction Value</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.refundAmount)}</p>
            <p className="text-sm text-gray-500">{stats.refundsProcessed} Refunds Processed</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.platformBalance)}</p>
            <p className="text-sm text-gray-500">Platform Balance</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link href="/admin/finance/transactions" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.map((txn) => {
              const typeConf = typeConfig[txn.type];
              const statusConf = statusConfig[txn.status];
              const TypeIcon = typeConf.icon;
              return (
                <div key={txn.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConf.bg}`}>
                    <TypeIcon className={`w-5 h-5 ${typeConf.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{typeConf.label}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${statusConf.bg} ${statusConf.color}`}>
                        {txn.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{txn.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${txn.type === 'refund' || txn.type === 'payout' ? 'text-red-600' : 'text-green-600'}`}>
                      {txn.type === 'refund' || txn.type === 'payout' ? '-' : '+'}{formatCurrency(txn.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{txn.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Country */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Revenue by Country</h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="p-6 space-y-4">
            {COUNTRY_REVENUE.map((c) => (
              <div key={c.country}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-medium text-gray-900">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{c.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-gold-500 h-2 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatCurrency(c.revenue)}</span>
                  <span>{c.transactions.toLocaleString()} transactions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="mt-8 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Seller Payouts</h2>
              <p className="text-sm text-gray-500">{payouts.length} settlements ready for processing</p>
            </div>
          </div>
          <Link href="/admin/finance/settlements" className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium">
            Manage Settlements
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Period End</th>
                <th className="px-6 py-4 font-medium text-right">Orders</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => {
                const statusConf = payoutStatusConfig[payout.status];
                return (
                  <tr key={payout.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{payout.sellerName}</p>
                      <p className="text-xs text-gray-500">{payout.id}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{payout.periodEnd}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{payout.ordersCount}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(payout.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConf.bg} ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-sm text-gold-600 hover:text-gold-700 font-medium">
                        Process
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/finance/transactions" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-gold-500" />
              <span className="font-medium text-gray-900">All Transactions</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500" />
          </div>
        </Link>
        <Link href="/admin/finance/settlements" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-400 group-hover:text-gold-500" />
              <span className="font-medium text-gray-900">Settlements</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500" />
          </div>
        </Link>
        <Link href="/admin/finance/commissions" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-gray-400 group-hover:text-gold-500" />
              <span className="font-medium text-gray-900">Commissions</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500" />
          </div>
        </Link>
        <Link href="/admin/refunds" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowDownRight className="w-5 h-5 text-gray-400 group-hover:text-gold-500" />
              <span className="font-medium text-gray-900">Refunds</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500" />
          </div>
        </Link>
      </div>
    </div>
  );
}
