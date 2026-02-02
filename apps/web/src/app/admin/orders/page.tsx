'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Truck,
  Package,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
} from 'lucide-react';

interface OrderRow {
  id: string;
  customerId?: string;
  customer?: string;
  email?: string;
  items?: number;
  amount?: number;
  total?: number;
  status?: string;
  paymentStatus?: string;
  payment?: string;
  createdAt?: string;
  date?: string;
}

const FALLBACK_ORDERS: OrderRow[] = [
  { id: 'GG-2024-001', customer: 'Priya Sharma', email: 'priya@email.com', items: 2, amount: 185000, status: 'delivered', payment: 'paid', date: '15 Jan 2024' },
  { id: 'GG-2024-002', customer: 'Rahul Mehta', email: 'rahul@email.com', items: 1, amount: 78500, status: 'processing', payment: 'paid', date: '18 Jan 2024' },
];

const statusColors = {
  delivered: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentColors = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getOrders({ page, limit: 20, status: statusFilter !== 'all' ? statusFilter : undefined })
      .then((res) => {
        const d = res as { data?: OrderRow[]; total?: number };
        const list = Array.isArray(d?.data) ? d.data : [];
        setOrders(list);
        setTotal(d?.total ?? list.length);
      })
      .catch(() => setOrders(FALLBACK_ORDERS))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery && !order.id?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(order.customer || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and track all orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'All Orders', value: '1,284', color: 'bg-gray-500' },
          { label: 'Pending', value: '45', color: 'bg-yellow-500' },
          { label: 'Processing', value: '128', color: 'bg-blue-500' },
          { label: 'Shipped', value: '86', color: 'bg-purple-500' },
          { label: 'Delivered', value: '1,025', color: 'bg-green-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
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
              placeholder="Search orders..."
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
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
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
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customer}</p>
                      <p className="text-sm text-gray-500">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{order.items ?? 0} items</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ₹{(order.amount ?? order.total ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      statusColors[order.status as keyof typeof statusColors]
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      paymentColors[(order.payment ?? order.paymentStatus) as keyof typeof paymentColors] ?? 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.payment ?? order.paymentStatus ?? '–'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.date ?? (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '–')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Track">
                        <Truck className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="More">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `Showing ${filteredOrders.length} of ${total} orders`}
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 bg-gold-500 text-white rounded-lg">1</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded-lg">2</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded-lg">3</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
