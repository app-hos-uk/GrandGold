'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronRight,
  Search,
  Filter,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  Download,
  Eye,
} from 'lucide-react';

const orders = [
  {
    id: 'GG-2024-001',
    date: '15 Jan 2024',
    total: 185000,
    status: 'delivered',
    items: [
      { name: 'Traditional Kundan Necklace Set', price: 185000, quantity: 1 },
    ],
    tracking: 'DEL123456789',
    deliveredDate: '20 Jan 2024',
  },
  {
    id: 'GG-2024-002',
    date: '28 Jan 2024',
    total: 123500,
    status: 'processing',
    items: [
      { name: 'Diamond Studded Jhumkas', price: 78500, quantity: 1 },
      { name: 'Pearl Drop Earrings', price: 45000, quantity: 1 },
    ],
    estimatedDelivery: '05 Feb 2024',
  },
  {
    id: 'GG-2024-003',
    date: '01 Feb 2024',
    total: 245000,
    status: 'shipped',
    items: [
      { name: 'Solitaire Engagement Ring', price: 245000, quantity: 1 },
    ],
    tracking: 'SHP987654321',
    estimatedDelivery: '08 Feb 2024',
  },
  {
    id: 'GG-2023-045',
    date: '15 Dec 2023',
    total: 55000,
    status: 'cancelled',
    items: [
      { name: 'Charm Bracelet', price: 55000, quantity: 1 },
    ],
    cancelledDate: '16 Dec 2023',
    cancelReason: 'Customer requested cancellation',
  },
];

const statusConfig = {
  delivered: { icon: CheckCircle, label: 'Delivered', color: 'text-green-600 bg-green-100' },
  processing: { icon: Clock, label: 'Processing', color: 'text-blue-600 bg-blue-100' },
  shipped: { icon: Truck, label: 'Shipped', color: 'text-purple-600 bg-purple-100' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-600 bg-red-100' },
};

const countryConfig = {
  in: { currency: '₹' },
  ae: { currency: 'AED ' },
  uk: { currency: '£' },
};

export default function OrdersPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const config = countryConfig[country];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const formatPrice = (price: number) => {
    return `${config.currency}${price.toLocaleString()}`;
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (searchQuery && !order.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href={`/${country}/account`} className="text-gray-500 hover:text-gold-600">
              My Account
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Orders</span>
          </nav>
        </div>
      </div>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Orders</h1>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      filterStatus === status
                        ? 'bg-gold-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-cream-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
                const statusLabel = statusConfig[order.status as keyof typeof statusConfig].label;
                const statusColor = statusConfig[order.status as keyof typeof statusConfig].color;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="p-6 border-b border-cream-100">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-gray-900">{order.id}</span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Placed on {order.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.items.length} item(s)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 mb-4 last:mb-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-8 h-8 text-gold-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="px-6 py-4 bg-cream-50 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        {order.status === 'delivered' && (
                          <span>Delivered on {order.deliveredDate}</span>
                        )}
                        {order.status === 'shipped' && (
                          <span>Estimated delivery: {order.estimatedDelivery}</span>
                        )}
                        {order.status === 'processing' && (
                          <span>Estimated delivery: {order.estimatedDelivery}</span>
                        )}
                        {order.status === 'cancelled' && (
                          <span>Cancelled on {order.cancelledDate}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {order.tracking && (
                          <button className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium">
                            <Truck className="w-4 h-4" />
                            Track Order
                          </button>
                        )}
                        <Link
                          href={`/${country}/account/orders/${order.id}`}
                          className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                        <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700">
                          <Download className="w-4 h-4" />
                          Invoice
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter'
                    : "You haven't placed any orders yet"}
                </p>
                <Link
                  href={`/${country}/collections`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
