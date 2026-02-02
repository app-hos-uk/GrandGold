'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  Printer,
} from 'lucide-react';

const orders = [
  { id: 'GG-2024-101', customer: 'Priya Sharma', email: 'priya@email.com', items: 'Traditional Kundan Necklace', itemCount: 1, amount: 185000, status: 'processing', payment: 'paid', date: '15 Jan 2024' },
  { id: 'GG-2024-102', customer: 'Rahul Mehta', email: 'rahul@email.com', items: 'Diamond Jhumkas', itemCount: 1, amount: 78500, status: 'shipped', payment: 'paid', date: '14 Jan 2024' },
  { id: 'GG-2024-103', customer: 'Ananya Reddy', email: 'ananya@email.com', items: 'Temple Choker + Earrings', itemCount: 2, amount: 320000, status: 'pending', payment: 'paid', date: '14 Jan 2024' },
  { id: 'GG-2024-104', customer: 'Vikram Singh', email: 'vikram@email.com', items: 'Gold Bangle Set', itemCount: 1, amount: 125000, status: 'delivered', payment: 'paid', date: '12 Jan 2024' },
  { id: 'GG-2024-105', customer: 'Neha Gupta', email: 'neha@email.com', items: 'Pearl Drop Earrings', itemCount: 1, amount: 45000, status: 'delivered', payment: 'paid', date: '10 Jan 2024' },
  { id: 'GG-2024-106', customer: 'Amit Kumar', email: 'amit@email.com', items: 'Diamond Ring', itemCount: 1, amount: 165000, status: 'cancelled', payment: 'refunded', date: '08 Jan 2024' },
];

const statusColors = {
  delivered: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function SellerOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery && !order.id.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !order.customer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and fulfill customer orders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'All Orders', value: '124', color: 'bg-gray-100' },
          { label: 'Pending', value: '8', color: 'bg-yellow-100' },
          { label: 'Processing', value: '15', color: 'bg-blue-100' },
          { label: 'Shipped', value: '12', color: 'bg-purple-100' },
          { label: 'Delivered', value: '89', color: 'bg-green-100' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4`}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-gray-100">
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
              Date
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
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
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{order.items}</p>
                    <p className="text-xs text-gray-500">{order.itemCount} item(s)</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ₹{order.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      statusColors[order.status as keyof typeof statusColors]
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Print">
                        <Printer className="w-4 h-4 text-gray-500" />
                      </button>
                      {order.status === 'processing' && (
                        <button className="p-2 hover:bg-blue-50 rounded-lg" title="Ship">
                          <Truck className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 bg-gold-500 text-white rounded-lg">1</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded-lg">2</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
