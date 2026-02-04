'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Building,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Play,
  FileText,
  RefreshCw,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/admin/toast';

interface Settlement {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  commission: number;
  gatewayFees: number;
  taxes: number;
  otherDeductions: number;
  netAmount: number;
  orderCount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'on_hold';
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  createdAt: string;
  country: string;
}

const MOCK_SETTLEMENTS: Settlement[] = [
  { id: 'SET-2024-001', sellerId: 'SEL001', sellerName: 'Royal Jewellers', sellerEmail: 'finance@royaljewellers.com', periodStart: '2024-01-27', periodEnd: '2024-02-03', grossAmount: 540000, commission: 54000, gatewayFees: 10800, taxes: 16200, otherDeductions: 0, netAmount: 459000, orderCount: 42, currency: 'INR', status: 'pending', createdAt: '2024-02-03T10:00:00Z', country: 'IN' },
  { id: 'SET-2024-002', sellerId: 'SEL002', sellerName: 'Diamond Palace', sellerEmail: 'accounts@diamondpalace.com', periodStart: '2024-01-27', periodEnd: '2024-02-03', grossAmount: 385000, commission: 38500, gatewayFees: 7700, taxes: 11550, otherDeductions: 0, netAmount: 327250, orderCount: 28, currency: 'INR', status: 'processing', createdAt: '2024-02-03T09:00:00Z', country: 'IN' },
  { id: 'SET-2024-003', sellerId: 'SEL003', sellerName: 'Gold Craft India', sellerEmail: 'pay@goldcraft.in', periodStart: '2024-01-27', periodEnd: '2024-02-03', grossAmount: 220000, commission: 22000, gatewayFees: 4400, taxes: 6600, otherDeductions: 0, netAmount: 187000, orderCount: 15, currency: 'INR', status: 'completed', paymentMethod: 'NEFT', paymentReference: 'NEFT-2024020301', paidAt: '2024-02-03T14:00:00Z', createdAt: '2024-02-03T08:00:00Z', country: 'IN' },
  { id: 'SET-2024-004', sellerId: 'SEL004', sellerName: 'Heritage Jewels', sellerEmail: 'finance@heritagejewels.com', periodStart: '2024-01-27', periodEnd: '2024-02-03', grossAmount: 175000, commission: 17500, gatewayFees: 3500, taxes: 5250, otherDeductions: 2000, netAmount: 146750, orderCount: 12, currency: 'INR', status: 'on_hold', createdAt: '2024-02-03T07:00:00Z', country: 'IN' },
  { id: 'SET-2024-005', sellerId: 'SEL005', sellerName: 'Dubai Gold Souk', sellerEmail: 'pay@dubaigoldsouk.ae', periodStart: '2024-01-27', periodEnd: '2024-02-03', grossAmount: 125000, commission: 12500, gatewayFees: 2500, taxes: 0, otherDeductions: 0, netAmount: 110000, orderCount: 8, currency: 'AED', status: 'pending', createdAt: '2024-02-03T06:00:00Z', country: 'AE' },
  { id: 'SET-2024-006', sellerId: 'SEL006', sellerName: 'London Fine Jewels', sellerEmail: 'accounts@londonfinejewels.co.uk', periodStart: '2024-01-27', periodEnd: '2024-02-03', grossAmount: 95000, commission: 9500, gatewayFees: 1900, taxes: 0, otherDeductions: 0, netAmount: 83600, orderCount: 5, currency: 'GBP', status: 'completed', paymentMethod: 'Bank Transfer', paymentReference: 'BT-UK-2024020301', paidAt: '2024-02-02T16:00:00Z', createdAt: '2024-02-02T10:00:00Z', country: 'UK' },
];

const statusConfig = {
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock, label: 'Pending' },
  processing: { color: 'text-blue-600', bg: 'bg-blue-100', icon: RefreshCw, label: 'Processing' },
  completed: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Completed' },
  failed: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle, label: 'Failed' },
  on_hold: { color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertCircle, label: 'On Hold' },
};

export default function SettlementsPage() {
  const toast = useToast();
  const [settlements, setSettlements] = useState<Settlement[]>(MOCK_SETTLEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [processModal, setProcessModal] = useState<Settlement | null>(null);
  const [processing, setProcessing] = useState(false);

  const filteredSettlements = settlements.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (countryFilter && s.country !== countryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.sellerName.toLowerCase().includes(q) ||
        s.sellerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    pending: settlements.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.netAmount, 0),
    pendingCount: settlements.filter((s) => s.status === 'pending').length,
    processing: settlements.filter((s) => s.status === 'processing').length,
    completed: settlements.filter((s) => s.status === 'completed').reduce((sum, s) => sum + s.netAmount, 0),
    onHold: settlements.filter((s) => s.status === 'on_hold').length,
  };

  const handleProcess = async (settlement: Settlement, paymentRef: string, paymentMethod: string) => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    
    setSettlements((prev) =>
      prev.map((s) =>
        s.id === settlement.id
          ? { ...s, status: 'completed', paymentReference: paymentRef, paymentMethod, paidAt: new Date().toISOString() }
          : s
      )
    );
    
    toast.success(`Settlement ${settlement.id} marked as paid`);
    setProcessing(false);
    setProcessModal(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Finance', href: '/admin/finance' }, { label: 'Settlements' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Settlements</h1>
          <p className="text-gray-600">Manage seller payouts and settlements</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            Process All Pending
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payouts</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.pending)}</p>
              <p className="text-xs text-gray-500">{stats.pendingCount} settlements</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Processing</p>
              <p className="text-xl font-bold text-blue-600">{stats.processing}</p>
              <p className="text-xs text-gray-500">settlements</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid This Month</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.completed)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">On Hold</p>
              <p className="text-xl font-bold text-orange-600">{stats.onHold}</p>
              <p className="text-xs text-gray-500">need review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or seller name..."
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
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
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
                <th className="px-6 py-4 font-medium">Settlement ID</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Period</th>
                <th className="px-6 py-4 font-medium text-right">Orders</th>
                <th className="px-6 py-4 font-medium text-right">Gross</th>
                <th className="px-6 py-4 font-medium text-right">Deductions</th>
                <th className="px-6 py-4 font-medium text-right">Net Payout</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSettlements.map((settlement) => {
                const statusConf = statusConfig[settlement.status];
                const StatusIcon = statusConf.icon;
                const totalDeductions = settlement.commission + settlement.gatewayFees + settlement.taxes + settlement.otherDeductions;

                return (
                  <motion.tr
                    key={settlement.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{settlement.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{settlement.sellerName}</p>
                      <p className="text-xs text-gray-500">{settlement.sellerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(settlement.periodStart)} - {formatDate(settlement.periodEnd)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">{settlement.orderCount}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(settlement.grossAmount)}</td>
                    <td className="px-6 py-4 text-right text-red-600">-{formatCurrency(totalDeductions)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">{formatCurrency(settlement.netAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedSettlement(settlement)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        {settlement.status === 'pending' && (
                          <button
                            onClick={() => setProcessModal(settlement)}
                            className="p-2 hover:bg-green-50 rounded-lg"
                            title="Process Payment"
                          >
                            <Play className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        {settlement.status === 'completed' && (
                          <button className="p-2 hover:bg-gray-100 rounded-lg" title="Download Invoice">
                            <FileText className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredSettlements.length} of {settlements.length} settlements
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

      {/* Process Payment Modal */}
      <AnimatePresence>
        {processModal && (
          <ProcessPaymentModal
            settlement={processModal}
            onClose={() => setProcessModal(null)}
            onProcess={handleProcess}
            processing={processing}
          />
        )}
      </AnimatePresence>

      {/* Settlement Detail Modal */}
      <AnimatePresence>
        {selectedSettlement && (
          <SettlementDetailModal
            settlement={selectedSettlement}
            onClose={() => setSelectedSettlement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProcessPaymentModal({
  settlement,
  onClose,
  onProcess,
  processing,
}: {
  settlement: Settlement;
  onClose: () => void;
  onProcess: (settlement: Settlement, paymentRef: string, paymentMethod: string) => void;
  processing: boolean;
}) {
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('NEFT');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Process Settlement Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Paying to</p>
            <p className="font-semibold text-gray-900">{settlement.sellerName}</p>
            <p className="text-sm text-gray-500">{settlement.sellerEmail}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Amount to Pay</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(settlement.netAmount)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="NEFT">NEFT</option>
              <option value="IMPS">IMPS</option>
              <option value="RTGS">RTGS</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Enter transaction reference"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onProcess(settlement, paymentRef, paymentMethod)}
              disabled={processing || !paymentRef}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {processing ? 'Processing...' : 'Mark as Paid'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettlementDetailModal({
  settlement,
  onClose,
}: {
  settlement: Settlement;
  onClose: () => void;
}) {
  const statusConf = statusConfig[settlement.status];
  const StatusIcon = statusConf.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Settlement Details</h2>
            <p className="text-sm text-gray-500">{settlement.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status</span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConf.bg} ${statusConf.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConf.label}
            </span>
          </div>

          {/* Seller Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Seller</p>
            <p className="font-semibold text-gray-900">{settlement.sellerName}</p>
            <p className="text-sm text-gray-500">{settlement.sellerEmail}</p>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Period Start</p>
              <p className="font-medium text-gray-900">{new Date(settlement.periodStart).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Period End</p>
              <p className="font-medium text-gray-900">{new Date(settlement.periodEnd).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Amount ({settlement.orderCount} orders)</span>
                <span className="font-medium text-gray-900">{formatCurrency(settlement.grossAmount)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Platform Commission (10%)</span>
                <span>-{formatCurrency(settlement.commission)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Gateway Fees (2%)</span>
                <span>-{formatCurrency(settlement.gatewayFees)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Taxes</span>
                <span>-{formatCurrency(settlement.taxes)}</span>
              </div>
              {settlement.otherDeductions > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Other Deductions</span>
                  <span>-{formatCurrency(settlement.otherDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Net Payout</span>
                <span className="font-bold text-green-600">{formatCurrency(settlement.netAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info (if completed) */}
          {settlement.status === 'completed' && settlement.paymentReference && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Payment Completed</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Method</p>
                  <p className="font-medium text-gray-900">{settlement.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reference</p>
                  <p className="font-medium text-gray-900">{settlement.paymentReference}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
