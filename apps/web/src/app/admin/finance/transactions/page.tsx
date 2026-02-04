'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Building,
  Eye,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/admin/toast';

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'commission' | 'adjustment';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  gateway: string;
  country: string;
  createdAt: string;
  metadata?: {
    orderId?: string;
    sellerId?: string;
    sellerName?: string;
    customerId?: string;
    customerName?: string;
  };
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-2024-001', type: 'payment', amount: 85000, currency: 'INR', status: 'completed', description: 'Order payment', reference: 'ORD-2024-1234', gateway: 'Razorpay', country: 'IN', createdAt: '2024-02-03T14:32:00Z', metadata: { orderId: 'ORD-2024-1234', customerId: 'USR001', customerName: 'Priya Sharma' } },
  { id: 'TXN-2024-002', type: 'commission', amount: 8500, currency: 'INR', status: 'completed', description: 'Platform commission', reference: 'ORD-2024-1234', gateway: 'Internal', country: 'IN', createdAt: '2024-02-03T14:32:00Z', metadata: { orderId: 'ORD-2024-1234', sellerId: 'SEL001', sellerName: 'Royal Jewellers' } },
  { id: 'TXN-2024-003', type: 'payout', amount: 125000, currency: 'INR', status: 'pending', description: 'Seller payout', reference: 'SET-2024-001', gateway: 'NEFT', country: 'IN', createdAt: '2024-02-03T13:00:00Z', metadata: { sellerId: 'SEL001', sellerName: 'Diamond Palace' } },
  { id: 'TXN-2024-004', type: 'refund', amount: 42000, currency: 'AED', status: 'completed', description: 'Customer refund', reference: 'ORD-2024-1198', gateway: 'Stripe', country: 'AE', createdAt: '2024-02-03T12:00:00Z', metadata: { orderId: 'ORD-2024-1198', customerId: 'USR045', customerName: 'Ahmed Al-Farsi' } },
  { id: 'TXN-2024-005', type: 'payment', amount: 156000, currency: 'GBP', status: 'completed', description: 'Order payment', reference: 'ORD-2024-1233', gateway: 'Stripe', country: 'UK', createdAt: '2024-02-03T11:00:00Z', metadata: { orderId: 'ORD-2024-1233', customerId: 'USR078', customerName: 'James Wilson' } },
  { id: 'TXN-2024-006', type: 'payment', amount: 98000, currency: 'INR', status: 'failed', description: 'Order payment failed', reference: 'ORD-2024-1232', gateway: 'Razorpay', country: 'IN', createdAt: '2024-02-03T10:30:00Z', metadata: { orderId: 'ORD-2024-1232', customerId: 'USR012', customerName: 'Rahul Mehta' } },
  { id: 'TXN-2024-007', type: 'payout', amount: 285000, currency: 'INR', status: 'completed', description: 'Seller payout', reference: 'SET-2024-002', gateway: 'IMPS', country: 'IN', createdAt: '2024-02-02T16:00:00Z', metadata: { sellerId: 'SEL003', sellerName: 'Gold Craft India' } },
  { id: 'TXN-2024-008', type: 'adjustment', amount: 5000, currency: 'INR', status: 'completed', description: 'Manual adjustment - promo credit', reference: 'ADJ-001', gateway: 'Internal', country: 'IN', createdAt: '2024-02-02T14:00:00Z' },
];

const typeConfig = {
  payment: { color: 'text-green-600', bg: 'bg-green-100', icon: ArrowUpRight, label: 'Payment', sign: '+' },
  refund: { color: 'text-red-600', bg: 'bg-red-100', icon: ArrowDownRight, label: 'Refund', sign: '-' },
  payout: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Building, label: 'Payout', sign: '-' },
  commission: { color: 'text-purple-600', bg: 'bg-purple-100', icon: DollarSign, label: 'Commission', sign: '+' },
  adjustment: { color: 'text-orange-600', bg: 'bg-orange-100', icon: CreditCard, label: 'Adjustment', sign: '±' },
};

const statusConfig = {
  completed: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
  failed: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  cancelled: { color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertCircle },
};

const COUNTRIES = ['IN', 'AE', 'UK'] as const;

export default function TransactionsPage() {
  const toast = useToast();
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTransactions = transactions.filter((txn) => {
    if (typeFilter !== 'all' && txn.type !== typeFilter) return false;
    if (statusFilter !== 'all' && txn.status !== statusFilter) return false;
    if (countryFilter && txn.country !== countryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        txn.id.toLowerCase().includes(q) ||
        txn.reference.toLowerCase().includes(q) ||
        txn.description.toLowerCase().includes(q) ||
        txn.metadata?.customerName?.toLowerCase().includes(q) ||
        txn.metadata?.sellerName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    totalIn: transactions.filter((t) => t.type === 'payment' || t.type === 'commission').reduce((sum, t) => sum + t.amount, 0),
    totalOut: transactions.filter((t) => t.type === 'refund' || t.type === 'payout').reduce((sum, t) => sum + t.amount, 0),
    pending: transactions.filter((t) => t.status === 'pending').length,
    failed: transactions.filter((t) => t.status === 'failed').length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Finance', href: '/admin/finance' }, { label: 'Transactions' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">View all platform financial transactions</p>
        </div>
        <button
          onClick={() => {
            const headers = ['ID', 'Type', 'Amount', 'Currency', 'Status', 'Date', 'Description', 'Reference'];
            const rows = filteredTransactions.map(t => [
              t.id,
              t.type,
              t.amount,
              t.currency,
              t.status,
              t.createdAt,
              t.description.replace(/,/g, ';'),
              t.reference,
            ].join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions-export-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Transactions exported successfully');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Inflow</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIn)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Outflow</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOut)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, reference, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Types</option>
              <option value="payment">Payments</option>
              <option value="refund">Refunds</option>
              <option value="payout">Payouts</option>
              <option value="commission">Commissions</option>
              <option value="adjustment">Adjustments</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="">All Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-t border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Gateway</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((txn) => {
                const typeConf = typeConfig[txn.type];
                const statusConf = statusConfig[txn.status];
                const TypeIcon = typeConf.icon;
                const StatusIcon = statusConf.icon;
                const dt = formatDate(txn.createdAt);

                return (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{txn.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeConf.bg}`}>
                          <TypeIcon className={`w-4 h-4 ${typeConf.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{typeConf.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{txn.description}</p>
                      {txn.metadata?.customerName && (
                        <p className="text-xs text-gray-500">{txn.metadata.customerName}</p>
                      )}
                      {txn.metadata?.sellerName && (
                        <p className="text-xs text-gray-500">{txn.metadata.sellerName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{txn.reference}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{txn.gateway}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${txn.type === 'refund' || txn.type === 'payout' ? 'text-red-600' : 'text-green-600'}`}>
                        {typeConf.sign}{formatCurrency(txn.amount)}
                      </span>
                      <p className="text-xs text-gray-500">{txn.currency}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-gray-900">{dt.date}</p>
                      <p className="text-gray-500">{dt.time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(() => {
          const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
          const startIdx = (currentPage - 1) * itemsPerPage;
          const endIdx = Math.min(startIdx + itemsPerPage, filteredTransactions.length);
          return (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {filteredTransactions.length > 0 ? startIdx + 1 : 0}-{endIdx} of {filteredTransactions.length} transactions
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button 
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg ${currentPage === pageNum ? 'bg-gold-500 text-white' : 'hover:bg-gray-100'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
