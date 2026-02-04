'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight,
  Download,
  Store,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

const sellers = [
  { id: 1, name: 'Royal Jewellers', email: 'contact@royaljewellers.com', phone: '+91 98765 43210', products: 124, orders: 856, revenue: 4520000, rating: 4.9, status: 'verified', joined: '10 Jan 2024' },
  { id: 2, name: 'Diamond Palace', email: 'info@diamondpalace.com', phone: '+91 98765 43211', products: 98, orders: 642, revenue: 3850000, rating: 4.8, status: 'verified', joined: '15 Jan 2024' },
  { id: 3, name: 'Gold Craft India', email: 'sales@goldcraft.in', phone: '+91 98765 43212', products: 87, orders: 521, revenue: 3280000, rating: 4.7, status: 'verified', joined: '20 Jan 2024' },
  { id: 4, name: 'Heritage Jewels', email: 'hello@heritagejewels.com', phone: '+91 98765 43213', products: 76, orders: 445, revenue: 2860000, rating: 4.9, status: 'verified', joined: '25 Jan 2024' },
  { id: 5, name: 'Modern Gold Co.', email: 'info@moderngold.com', phone: '+91 98765 43214', products: 45, orders: 234, revenue: 1520000, rating: 4.5, status: 'pending', joined: '01 Feb 2024' },
  { id: 6, name: 'Classic Ornaments', email: 'sales@classicornaments.com', phone: '+91 98765 43215', products: 32, orders: 156, revenue: 980000, rating: 4.3, status: 'pending', joined: '05 Feb 2024' },
  { id: 7, name: 'Gem & Gold House', email: 'contact@gemgold.com', phone: '+91 98765 43216', products: 0, orders: 0, revenue: 0, rating: 0, status: 'rejected', joined: '08 Feb 2024' },
  { id: 8, name: 'Precious Metals Ltd', email: 'info@preciousmetals.com', phone: '+91 98765 43217', products: 56, orders: 312, revenue: 1850000, rating: 4.6, status: 'verified', joined: '12 Feb 2024' },
];

const statusConfig = {
  verified: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function SellersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addSellerOpen, setAddSellerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredSellers = sellers.filter((seller) => {
    if (statusFilter !== 'all' && seller.status !== statusFilter) return false;
    if (searchQuery && !seller.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !seller.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>
          <p className="text-gray-600">Manage marketplace sellers</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setAddSellerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Seller
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sellers', value: '248', icon: Store },
          { label: 'Verified', value: '186', color: 'text-green-600' },
          { label: 'Pending Approval', value: '42', color: 'text-yellow-600' },
          { label: 'Total Revenue', value: '₹4.52 Cr', color: 'text-gold-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <span className={`text-2xl font-bold ${stat.color || 'text-gray-900'}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-t border-b border-gray-100">
                <th className="px-6 py-4 font-medium">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Products</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Revenue</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map((seller) => {
                const statusEntry = statusConfig[seller.status as keyof typeof statusConfig] ?? statusConfig.pending;
                const StatusIcon = statusEntry.icon;
                return (
                  <motion.tr
                    key={seller.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
                          <Store className="w-5 h-5 text-gold-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{seller.name}</p>
                          <p className="text-sm text-gray-500">{seller.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{seller.products}</td>
                    <td className="px-6 py-4 text-gray-900">{seller.orders}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ₹{(seller.revenue / 100000).toFixed(1)}L
                    </td>
                    <td className="px-6 py-4">
                      {seller.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                          <span className="font-medium">{seller.rating}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        statusEntry.color
                      }`}>
                        <StatusIcon className="w-3 h-3" />
                        {seller.status ?? 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{seller.joined}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button type="button" className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button type="button" className="p-2 hover:bg-gray-100 rounded-lg" title="More">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
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
            Showing {filteredSellers.length} of {sellers.length} sellers
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" className="px-3 py-1 bg-gold-500 text-white rounded-lg">1</button>
            <button type="button" className="px-3 py-1 hover:bg-gray-100 rounded-lg">2</button>
            <button type="button" className="px-3 py-1 hover:bg-gray-100 rounded-lg">3</button>
            <button type="button" className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Seller Modal */}
      <AnimatePresence>
        {addSellerOpen && (
          <AddSellerModal
            key="add-seller-modal"
            onClose={() => setAddSellerOpen(false)}
            onSubmit={async (data) => {
              setSubmitting(true);
              try {
                await adminApi.inviteSeller({
                  email: data.email,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  phone: data.phone,
                  businessName: data.businessName,
                  country: data.country,
                  tempPassword: data.tempPassword || undefined,
                });
              } finally {
                setSubmitting(false);
              }
            }}
            submitting={submitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddSellerModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (data: { email: string; firstName: string; lastName: string; phone: string; businessName: string; country: string; tempPassword?: string }) => Promise<void>;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    country: 'IN',
    tempPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await onSubmit(form);
      setSuccess('Invitation sent! They can complete onboarding at /seller/onboarding');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite seller');
    }
  };

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
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Invite Seller</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password (optional)</label>
            <input
              type="password"
              value={form.tempPassword}
              onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))}
              placeholder="Leave blank to auto-generate"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="IN">India</option>
              <option value="AE">UAE</option>
              <option value="UK">UK</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {submitting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
