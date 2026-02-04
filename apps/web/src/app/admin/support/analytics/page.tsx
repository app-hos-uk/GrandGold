'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MessageCircle,
  Bot,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Zap,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatCurrency } from '@/lib/format';

interface SupportMetrics {
  totalConversations: number;
  conversationsChange: number;
  avgResponseTime: number;
  responseTimeChange: number;
  avgResolutionTime: number;
  resolutionTimeChange: number;
  csatScore: number;
  csatChange: number;
  firstContactResolution: number;
  aiHandledPercent: number;
  aiEscalationRate: number;
  ticketsCreated: number;
  ticketsResolved: number;
}

const MOCK_METRICS: SupportMetrics = {
  totalConversations: 2847,
  conversationsChange: 12.5,
  avgResponseTime: 25,
  responseTimeChange: -18,
  avgResolutionTime: 4.2,
  resolutionTimeChange: -8,
  csatScore: 4.7,
  csatChange: 0.3,
  firstContactResolution: 78,
  aiHandledPercent: 68,
  aiEscalationRate: 32,
  ticketsCreated: 324,
  ticketsResolved: 298,
};

const HOURLY_VOLUME = [
  { hour: '00:00', chats: 12, tickets: 5 },
  { hour: '02:00', chats: 8, tickets: 3 },
  { hour: '04:00', chats: 5, tickets: 2 },
  { hour: '06:00', chats: 15, tickets: 8 },
  { hour: '08:00', chats: 45, tickets: 20 },
  { hour: '10:00', chats: 120, tickets: 45 },
  { hour: '12:00', chats: 95, tickets: 38 },
  { hour: '14:00', chats: 135, tickets: 52 },
  { hour: '16:00', chats: 110, tickets: 42 },
  { hour: '18:00', chats: 85, tickets: 35 },
  { hour: '20:00', chats: 55, tickets: 22 },
  { hour: '22:00', chats: 28, tickets: 12 },
];

const CATEGORY_BREAKDOWN = [
  { category: 'Orders & Shipping', count: 485, percent: 38, color: 'bg-blue-500' },
  { category: 'Returns & Refunds', count: 312, percent: 24, color: 'bg-red-500' },
  { category: 'Payment Issues', count: 198, percent: 15, color: 'bg-green-500' },
  { category: 'Product Queries', count: 156, percent: 12, color: 'bg-purple-500' },
  { category: 'Account/KYC', count: 89, percent: 7, color: 'bg-orange-500' },
  { category: 'Other', count: 52, percent: 4, color: 'bg-gray-500' },
];

const AGENT_PERFORMANCE = [
  { name: 'Rahul Mehta', chatsHandled: 156, avgRating: 4.9, avgResponseTime: 18, resolutionRate: 96 },
  { name: 'Sarah Khan', chatsHandled: 142, avgRating: 4.8, avgResponseTime: 22, resolutionRate: 94 },
  { name: 'John Smith', chatsHandled: 128, avgRating: 4.7, avgResponseTime: 25, resolutionRate: 92 },
  { name: 'Priya Patel', chatsHandled: 118, avgRating: 4.6, avgResponseTime: 28, resolutionRate: 90 },
];

const AI_PERFORMANCE = {
  queriesHandled: 1936,
  successfulResolutions: 1316,
  escalatedToHuman: 620,
  avgConfidence: 87,
  topIntents: [
    { intent: 'Track Order', count: 425, accuracy: 95 },
    { intent: 'Return Policy', count: 312, accuracy: 92 },
    { intent: 'Delivery Time', count: 289, accuracy: 94 },
    { intent: 'Gold Purity', count: 198, accuracy: 88 },
    { intent: 'Payment Help', count: 156, accuracy: 85 },
  ],
};

const CSAT_BREAKDOWN = [
  { rating: 5, count: 1245, percent: 52 },
  { rating: 4, count: 756, percent: 32 },
  { rating: 3, count: 245, percent: 10 },
  { rating: 2, count: 98, percent: 4 },
  { rating: 1, count: 48, percent: 2 },
];

export default function SupportAnalyticsPage() {
  const [metrics] = useState<SupportMetrics>(MOCK_METRICS);
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(false);

  const maxVolume = Math.max(...HOURLY_VOLUME.map((h) => h.chats));

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Support', href: '/admin/support' }, { label: 'Analytics' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Analytics</h1>
          <p className="text-gray-600">Performance metrics and insights</p>
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
          </select>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${metrics.conversationsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.conversationsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(metrics.conversationsChange)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.totalConversations.toLocaleString()}</h3>
          <p className="text-gray-500 text-sm">Total Conversations</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${metrics.responseTimeChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.responseTimeChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {Math.abs(metrics.responseTimeChange)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.avgResponseTime} sec</h3>
          <p className="text-gray-500 text-sm">Avg. First Response</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${metrics.csatChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.csatChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              +{metrics.csatChange}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.csatScore}/5</h3>
          <p className="text-gray-500 text-sm">CSAT Score</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.aiHandledPercent}%</h3>
          <p className="text-gray-500 text-sm">AI Resolution Rate</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Hourly Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Conversation Volume by Hour</h3>
          <div className="flex items-end gap-1 h-48">
            {HOURLY_VOLUME.map((h, i) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(h.chats / maxVolume) * 100}%` }}
                  transition={{ delay: i * 0.03 }}
                  className="w-full bg-gold-500 rounded-t hover:bg-gold-600 transition-colors min-h-[4px]"
                  title={`${h.hour}: ${h.chats} chats`}
                />
                <span className="text-xs text-gray-400 mt-2 rotate-45 origin-left">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">By Category</h3>
          <div className="space-y-3">
            {CATEGORY_BREAKDOWN.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{cat.category}</span>
                  <span className="font-medium text-gray-900">{cat.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percent}%` }}
                    className={`h-2 rounded-full ${cat.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* AI Bot Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">AI Bot Performance</h3>
            </div>
            <span className="text-sm px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">
              {AI_PERFORMANCE.avgConfidence}% avg. confidence
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{AI_PERFORMANCE.queriesHandled.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Queries Handled</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{AI_PERFORMANCE.successfulResolutions.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xl font-bold text-orange-600">{AI_PERFORMANCE.escalatedToHuman.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Escalated</p>
            </div>
          </div>

          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Recognized Intents</h4>
          <div className="space-y-2">
            {AI_PERFORMANCE.topIntents.map((intent) => (
              <div key={intent.intent} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{intent.intent}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{intent.count}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${intent.accuracy >= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {intent.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSAT Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Customer Satisfaction</h3>
            </div>
            <span className="text-2xl font-bold text-yellow-600">{metrics.csatScore}/5</span>
          </div>

          <div className="space-y-3 mb-6">
            {CSAT_BREAKDOWN.map((rating) => (
              <div key={rating.rating} className="flex items-center gap-3">
                <span className="text-sm w-8">{rating.rating}★</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rating.percent}%` }}
                    className={`h-4 rounded-full ${rating.rating >= 4 ? 'bg-green-500' : rating.rating === 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
                </div>
                <span className="text-sm text-gray-500 w-12">{rating.percent}%</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-lg font-bold text-gray-900">{metrics.firstContactResolution}%</p>
                <p className="text-xs text-gray-500">First Contact Resolution</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-gray-900">{Math.round((metrics.ticketsResolved / metrics.ticketsCreated) * 100)}%</p>
                <p className="text-xs text-gray-500">Resolution Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Agent Performance</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium text-right">Chats Handled</th>
                <th className="px-6 py-4 font-medium text-right">Avg. Rating</th>
                <th className="px-6 py-4 font-medium text-right">Avg. Response Time</th>
                <th className="px-6 py-4 font-medium text-right">Resolution Rate</th>
              </tr>
            </thead>
            <tbody>
              {AGENT_PERFORMANCE.map((agent, i) => (
                <tr key={agent.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                        <span className="text-gold-600 font-semibold text-sm">{i + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">{agent.chatsHandled}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="flex items-center justify-end gap-1 text-yellow-600">
                      <Star className="w-4 h-4 fill-yellow-400" />
                      {agent.avgRating}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{agent.avgResponseTime}s</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${agent.resolutionRate >= 95 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {agent.resolutionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
