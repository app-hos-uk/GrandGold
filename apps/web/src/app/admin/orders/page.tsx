'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatRelativeDate, formatCurrency } from '@/lib/format';
import { useToast } from '@/components/admin/toast';
import { useConfirm } from '@/components/admin/confirm-dialog';
import { TableRowSkeleton } from '@/components/admin/skeleton';

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

const FALLBACK_ORDERS: OrderRow[] = [];
const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};
const paymentColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
};
const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export default function OrdersPage() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({ all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    adminApi
      .getOrders({ page, limit: 20, status: statusFilter !== 'all' ? statusFilter : undefined })
      .then((res) => {
        const d = res as { data?: OrderRow[]; total?: number };
        const list = Array.isArray(d?.data) ? d.data : [];
        setOrders(
          list.map((o) => ({
            ...o,
            date: o.createdAt ? formatRelativeDate(o.createdAt) : undefined,
          }))
        );
        setTotal(d?.total ?? list.length);
      })
      .catch(() => setOrders(FALLBACK_ORDERS))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setStatsLoading(true);
    Promise.all([
      adminApi.getOrders({ limit: 1 }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getOrders({ limit: 1, status: 'pending' }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getOrders({ limit: 1, status: 'processing' }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getOrders({ limit: 1, status: 'shipped' }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getOrders({ limit: 1, status: 'delivered' }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getOrders({ limit: 1, status: 'cancelled' }).then((r: unknown) => (r as { total?: number }).total ?? 0),
    ])
      .then(([all, pending, processing, shipped, delivered, cancelled]) =>
        setStats({ all, pending, processing, shipped, delivered, cancelled })
      )
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (searchQuery && !order.id?.toLowerCase().includes(searchQuery.toLowerCase()) && !(order.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) && !(order.email || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (dateFrom && order.createdAt && new Date(order.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && order.createdAt && new Date(order.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const ok = await confirm({ title: 'Update order status', message: `Change status to ${newStatus}?`, confirmLabel: 'Update', variant: 'default' });
    if (!ok) return;
    setUpdatingStatus(orderId);
    adminApi
      .updateOrderStatus(orderId, newStatus)
      .then(() => {
        toast.success('Order status updated');
        loadOrders();
        if (selectedOrder?.id === orderId) setSelectedOrder((o) => (o ? { ...o, status: newStatus } : null));
      })
      .catch(() => toast.error('Failed to update status'))
      .finally(() => setUpdatingStatus(null));
  };

  const openDrawer = (order: OrderRow) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const statTabs = [
    { key: 'all', label: 'All Orders', color: 'bg-gray-500' },
    { key: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { key: 'processing', label: 'Processing', color: 'bg-blue-500' },
    { key: 'shipped', label: 'Shipped', color: 'bg-purple-500' },
    { key: 'delivered', label: 'Delivered', color: 'bg-green-500' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  ];

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Orders' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and track all orders</p>
        </div>
        <button 
          type="button" 
          onClick={() => {
            // Generate CSV from orders
            const headers = ['Order ID', 'Customer', 'Email', 'Items', 'Amount', 'Status', 'Payment', 'Date'];
            const csvRows = [headers.join(',')];
            orders.forEach(o => {
              const row = [
                o.id,
                `"${o.customer || ''}"`,
                `"${o.email || ''}"`,
                o.items ?? 0,
                o.amount ?? o.total ?? 0,
                o.status || '',
                o.paymentStatus || o.payment || '',
                o.createdAt || o.date || ''
              ];
              csvRows.push(row.join(','));
            });
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Orders exported successfully');
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statTabs.map(({ key, label, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`bg-white rounded-xl p-4 shadow-sm text-left transition ring-2 ${
              statusFilter === key ? 'ring-gold-500' : 'ring-transparent hover:ring-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <p className="text-sm text-gray-500">{label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{statsLoading ? '—' : (stats[key] ?? 0).toLocaleString()}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              title="To date"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-t border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => openDrawer(order)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.customer ?? '—'}</p>
                        <p className="text-sm text-gray-500">{order.email ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.items ?? 0} items</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(order.amount ?? order.total ?? 0)}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status ?? 'pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={!!updatingStatus}
                        className={`text-xs font-medium capitalize rounded-full border-0 cursor-pointer ${statusColors[order.status ?? ''] ?? 'bg-gray-100 text-gray-700'} py-1 px-2`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${paymentColors[(order.payment ?? order.paymentStatus) as string] ?? 'bg-gray-100 text-gray-700'}`}>
                        {order.payment ?? order.paymentStatus ?? '–'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.date ?? (order.createdAt ? formatRelativeDate(order.createdAt) : '–')}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => openDrawer(order)} className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `Showing ${filteredOrders.length} of ${total} orders`}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button type="button" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order detail drawer */}
      <AnimatePresence>
        {drawerOpen && selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50" onClick={() => setDrawerOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">Order {selectedOrder.id}</h2>
                <button type="button" onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.customer ?? '—'}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold">{formatCurrency(selectedOrder.amount ?? selectedOrder.total ?? 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Items</p>
                  <p>{selectedOrder.items ?? 0} items</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <select
                    value={selectedOrder.status ?? 'pending'}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    disabled={!!updatingStatus}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p>{selectedOrder.createdAt ? formatRelativeDate(selectedOrder.createdAt) : '—'}</p>
                </div>
                <Link href={`/admin/refunds?order=${selectedOrder.id}`} className="block text-sm text-gold-600 hover:text-gold-700">View refunds for this order</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {dialog}
    </div>
  );
}
