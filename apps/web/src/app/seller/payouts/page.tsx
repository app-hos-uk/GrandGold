'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  ArrowUpRight,
  IndianRupee,
  Building,
} from 'lucide-react';

const payouts = [
  { id: 'PAY-001', amount: 285000, orders: 12, status: 'completed', date: '15 Jan 2024', method: 'Bank Transfer' },
  { id: 'PAY-002', amount: 420000, orders: 18, status: 'completed', date: '01 Jan 2024', method: 'Bank Transfer' },
  { id: 'PAY-003', amount: 195000, orders: 8, status: 'completed', date: '15 Dec 2023', method: 'Bank Transfer' },
  { id: 'PAY-004', amount: 380000, orders: 15, status: 'completed', date: '01 Dec 2023', method: 'Bank Transfer' },
  { id: 'PAY-005', amount: 156000, orders: 6, status: 'completed', date: '15 Nov 2023', method: 'Bank Transfer' },
];

const pendingPayouts = [
  { orderId: 'GG-2024-101', amount: 166500, date: '15 Jan 2024', status: 'processing' },
  { orderId: 'GG-2024-102', amount: 70650, date: '14 Jan 2024', status: 'processing' },
  { orderId: 'GG-2024-103', amount: 288000, date: '14 Jan 2024', status: 'pending' },
];

export default function SellerPayoutsPage() {
  const [dateRange, setDateRange] = useState('all');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600">Track your earnings and withdrawals</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Download Statement
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-gold-100">Available Balance</p>
          </div>
          <p className="text-4xl font-bold mb-2">₹5,25,150</p>
          <button className="mt-4 px-4 py-2 bg-white text-gold-600 rounded-lg font-medium hover:bg-gold-50 transition-colors">
            Request Payout
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-500">Pending</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹5,25,150</p>
          <p className="text-sm text-gray-500 mt-1">3 orders in processing</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-500">Total Earned</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹45,20,000</p>
          <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>+18.2% this month</span>
          </div>
        </motion.div>
      </div>

      {/* Bank Account */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payout Account</h2>
          <button className="text-sm text-gold-600 hover:text-gold-700 font-medium">
            Change
          </button>
        </div>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">HDFC Bank</p>
            <p className="text-sm text-gray-500">Account ending in ****4521</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Verified</span>
          </div>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="bg-white rounded-xl shadow-sm mb-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Pending Settlements</h2>
          <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            3 orders
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingPayouts.map((payout) => (
            <div key={payout.orderId} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{payout.orderId}</p>
                <p className="text-sm text-gray-500">{payout.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₹{payout.amount.toLocaleString()}</p>
                <span className={`text-xs font-medium ${
                  payout.status === 'processing' ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {payout.status === 'processing' ? 'Processing' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Time</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">This year</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Payout ID</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{payout.id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ₹{payout.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{payout.orders}</td>
                  <td className="px-6 py-4 text-gray-600">{payout.method}</td>
                  <td className="px-6 py-4 text-gray-500">{payout.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">Showing 5 payouts</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
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
