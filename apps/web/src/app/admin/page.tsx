'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react';

const stats = [
  {
    name: 'Total Revenue',
    value: '₹4,52,80,000',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-green-500',
  },
  {
    name: 'Total Orders',
    value: '1,284',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'bg-blue-500',
  },
  {
    name: 'Total Users',
    value: '24,521',
    change: '+15.3%',
    trend: 'up',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    name: 'Active Products',
    value: '856',
    change: '-2.4%',
    trend: 'down',
    icon: Package,
    color: 'bg-orange-500',
  },
];

const recentOrders = [
  { id: 'GG-2024-001', customer: 'Priya Sharma', amount: 185000, status: 'delivered', date: '2 hours ago' },
  { id: 'GG-2024-002', customer: 'Rahul Mehta', amount: 78500, status: 'processing', date: '4 hours ago' },
  { id: 'GG-2024-003', customer: 'Ananya Reddy', amount: 245000, status: 'shipped', date: '6 hours ago' },
  { id: 'GG-2024-004', customer: 'Vikram Singh', amount: 125000, status: 'pending', date: '8 hours ago' },
  { id: 'GG-2024-005', customer: 'Neha Gupta', amount: 95000, status: 'delivered', date: '12 hours ago' },
];

const topSellers = [
  { name: 'Royal Jewellers', sales: '₹45,20,000', orders: 124, rating: 4.9 },
  { name: 'Diamond Palace', sales: '₹38,50,000', orders: 98, rating: 4.8 },
  { name: 'Gold Craft India', sales: '₹32,80,000', orders: 87, rating: 4.7 },
  { name: 'Heritage Jewels', sales: '₹28,60,000', orders: 76, rating: 4.9 },
];

const statusColors = {
  delivered: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-500 text-sm">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <button className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 text-gray-600">{order.customer}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{order.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        statusColors[order.status as keyof typeof statusColors]
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{order.date}</td>
                    <td className="px-6 py-4">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Top Sellers</h2>
            <button className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View All
            </button>
          </div>
          <div className="p-6 space-y-4">
            {topSellers.map((seller, index) => (
              <div key={seller.name} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-600 font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{seller.name}</p>
                  <p className="text-sm text-gray-500">{seller.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{seller.sales}</p>
                  <p className="text-sm text-gray-500">⭐ {seller.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last year</option>
          </select>
        </div>
        <div className="h-64 bg-gradient-to-br from-gold-50 to-cream-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gold-400 mx-auto mb-2" />
            <p className="text-gray-500">Revenue chart visualization</p>
            <p className="text-sm text-gray-400">Integrate with your preferred charting library</p>
          </div>
        </div>
      </div>
    </div>
  );
}
