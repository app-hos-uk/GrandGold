'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MessageCircle,
  Ticket,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Bot,
  Headphones,
  BookOpen,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Phone,
  Mail,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatRelativeDate } from '@/lib/format';

interface SupportStats {
  openTickets: number;
  ticketsChange: number;
  avgResponseTime: number;
  responseTimeChange: number;
  resolutionRate: number;
  resolutionChange: number;
  activeChats: number;
  waitingCustomers: number;
  aiResolutionRate: number;
  customerSatisfaction: number;
}

const MOCK_STATS: SupportStats = {
  openTickets: 47,
  ticketsChange: -12,
  avgResponseTime: 25,
  responseTimeChange: -15,
  resolutionRate: 94,
  resolutionChange: 3,
  activeChats: 8,
  waitingCustomers: 3,
  aiResolutionRate: 68,
  customerSatisfaction: 4.7,
};

interface RecentTicket {
  id: string;
  subject: string;
  customer: string;
  type: 'order' | 'return' | 'payment' | 'product' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  channel: 'chat' | 'email' | 'phone' | 'whatsapp';
  assignee?: string;
  createdAt: string;
  country: string;
}

const MOCK_TICKETS: RecentTicket[] = [
  { id: 'TKT-2024-001', subject: 'Order not delivered - ORD-2024-1234', customer: 'Priya Sharma', type: 'order', priority: 'high', status: 'in_progress', channel: 'chat', assignee: 'Rahul M.', createdAt: '2024-02-03T14:30:00Z', country: 'IN' },
  { id: 'TKT-2024-002', subject: 'Refund not received', customer: 'Ahmed Al-Farsi', type: 'payment', priority: 'urgent', status: 'open', channel: 'email', createdAt: '2024-02-03T14:15:00Z', country: 'AE' },
  { id: 'TKT-2024-003', subject: 'Wrong product received', customer: 'James Wilson', type: 'return', priority: 'high', status: 'pending', channel: 'phone', assignee: 'Sarah K.', createdAt: '2024-02-03T13:45:00Z', country: 'UK' },
  { id: 'TKT-2024-004', subject: 'Unable to complete KYC', customer: 'Anita Desai', type: 'account', priority: 'medium', status: 'open', channel: 'chat', createdAt: '2024-02-03T13:00:00Z', country: 'IN' },
  { id: 'TKT-2024-005', subject: 'Product availability query', customer: 'Fatima Hassan', type: 'product', priority: 'low', status: 'resolved', channel: 'whatsapp', assignee: 'AI Bot', createdAt: '2024-02-03T12:30:00Z', country: 'AE' },
];

interface LiveAgent {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  activeChats: number;
  resolvedToday: number;
  avgRating: number;
}

const MOCK_AGENTS: LiveAgent[] = [
  { id: 'A1', name: 'Rahul Mehta', avatar: 'RM', status: 'online', activeChats: 3, resolvedToday: 12, avgRating: 4.8 },
  { id: 'A2', name: 'Sarah Khan', avatar: 'SK', status: 'busy', activeChats: 4, resolvedToday: 8, avgRating: 4.9 },
  { id: 'A3', name: 'John Smith', avatar: 'JS', status: 'online', activeChats: 1, resolvedToday: 15, avgRating: 4.6 },
  { id: 'A4', name: 'Priya Patel', avatar: 'PP', status: 'away', activeChats: 0, resolvedToday: 10, avgRating: 4.7 },
];

const priorityConfig = {
  low: { color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { color: 'text-red-600', bg: 'bg-red-100' },
};

const statusConfig = {
  open: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
  pending: { color: 'text-purple-600', bg: 'bg-purple-100' },
  in_progress: { color: 'text-blue-600', bg: 'bg-blue-100' },
  resolved: { color: 'text-green-600', bg: 'bg-green-100' },
  closed: { color: 'text-gray-600', bg: 'bg-gray-100' },
};

const channelConfig = {
  chat: { icon: MessageCircle, label: 'Chat' },
  email: { icon: Mail, label: 'Email' },
  phone: { icon: Phone, label: 'Phone' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp' },
};

const agentStatusConfig = {
  online: { color: 'bg-green-500', label: 'Online' },
  busy: { color: 'bg-red-500', label: 'Busy' },
  away: { color: 'bg-yellow-500', label: 'Away' },
  offline: { color: 'bg-gray-400', label: 'Offline' },
};

export default function SupportDashboard() {
  const [stats] = useState<SupportStats>(MOCK_STATS);
  const [tickets] = useState<RecentTicket[]>(MOCK_TICKETS);
  const [agents] = useState<LiveAgent[]>(MOCK_AGENTS);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Support' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
          <p className="text-gray-600">Manage tickets, live chats, and support operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/support/tickets/new"
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
          >
            <Ticket className="w-4 h-4" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-yellow-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.ticketsChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.ticketsChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {Math.abs(stats.ticketsChange)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.openTickets}</h3>
          <p className="text-gray-500 text-sm">Open Tickets</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.responseTimeChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.responseTimeChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {Math.abs(stats.responseTimeChange)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.avgResponseTime} min</h3>
          <p className="text-gray-500 text-sm">Avg. Response Time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="w-4 h-4" />
              {stats.resolutionChange}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.resolutionRate}%</h3>
          <p className="text-gray-500 text-sm">Resolution Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.aiResolutionRate}%</h3>
          <p className="text-gray-500 text-sm">AI Bot Resolution</p>
        </motion.div>
      </div>

      {/* Live Status Bar */}
      <div className="bg-gradient-to-r from-burgundy-900 to-burgundy-800 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="font-medium">{stats.activeChats} Active Chats</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span>{stats.waitingCustomers} Customers Waiting</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold-400" />
              <span>{stats.customerSatisfaction}/5 CSAT Score</span>
            </div>
          </div>
          <Link
            href="/admin/support/live-chat"
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <Headphones className="w-4 h-4" />
            Open Live Chat Console
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
            <Link href="/admin/support/tickets" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {tickets.map((ticket) => {
              const priorityConf = priorityConfig[ticket.priority];
              const statusConf = statusConfig[ticket.status];
              const ChannelIcon = channelConfig[ticket.channel].icon;

              return (
                <div key={ticket.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${priorityConf.bg}`}>
                      <ChannelIcon className={`w-5 h-5 ${priorityConf.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-500">{ticket.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConf.bg} ${priorityConf.color}`}>
                          {ticket.priority}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.bg} ${statusConf.color}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                      <p className="text-sm text-gray-500">{ticket.customer} · {ticket.country}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{formatRelativeDate(ticket.createdAt)}</p>
                      {ticket.assignee && (
                        <p className="text-xs text-gray-400 mt-1">Assigned: {ticket.assignee}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Agents */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Support Team</h2>
            <Link href="/admin/support/agents" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              Manage
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {agents.map((agent) => {
              const statusConf = agentStatusConfig[agent.status];
              return (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
                      <span className="text-gold-600 font-semibold text-sm">{agent.avatar}</span>
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${statusConf.color} rounded-full border-2 border-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-500">
                      {agent.activeChats} chats · {agent.resolvedToday} resolved
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <span>★</span>
                      <span>{agent.avgRating}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/support/tickets" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-gray-400 group-hover:text-gold-500" />
              <span className="font-medium text-gray-900">All Tickets</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500" />
          </div>
        </Link>
        <Link href="/admin/support/live-chat" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-gray-400 group-hover:text-gold-500" />
              <span className="font-medium text-gray-900">Live Chat</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500" />
          </div>
        </Link>
        <Link href="/admin/support/knowledge-base" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-gold-500" />
              <span className="font-medium text-gray-900">Knowledge Base</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500" />
          </div>
        </Link>
        <Link href="/admin/support/analytics" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-gold-500" />
              <span className="font-medium text-gray-900">Analytics</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500" />
          </div>
        </Link>
      </div>
    </div>
  );
}
