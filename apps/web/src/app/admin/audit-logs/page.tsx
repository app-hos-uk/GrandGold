'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  User,
  Settings,
  ShoppingCart,
  Package,
  CreditCard,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Monitor,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  category: 'auth' | 'users' | 'orders' | 'products' | 'payments' | 'settings' | 'security';
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  details: string;
  status: 'success' | 'failed' | 'warning';
  ip: string;
  userAgent: string;
  country?: string;
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-02-03T14:32:15Z',
    actor: { id: 'u1', name: 'Super Admin', email: 'mail@jsabu.com', role: 'super_admin' },
    action: 'user.role_changed',
    category: 'users',
    resource: { type: 'user', id: 'u5', name: 'John Doe' },
    details: 'Changed role from "customer" to "country_admin" for country IN',
    status: 'success',
    ip: '182.73.192.xx',
    userAgent: 'Chrome 120 / macOS',
    country: 'IN',
  },
  {
    id: '2',
    timestamp: '2024-02-03T14:28:45Z',
    actor: { id: 'u1', name: 'Super Admin', email: 'mail@jsabu.com', role: 'super_admin' },
    action: 'settings.updated',
    category: 'settings',
    resource: { type: 'settings', id: 'payments' },
    details: 'Updated Stripe API configuration',
    status: 'success',
    ip: '182.73.192.xx',
    userAgent: 'Chrome 120 / macOS',
    country: 'IN',
  },
  {
    id: '3',
    timestamp: '2024-02-03T14:15:00Z',
    actor: { id: 'u2', name: 'Rahul Mehta', email: 'rahul@example.com', role: 'country_admin' },
    action: 'order.status_updated',
    category: 'orders',
    resource: { type: 'order', id: 'ORD-2024-1234', name: 'Order #1234' },
    details: 'Changed status from "processing" to "shipped"',
    status: 'success',
    ip: '103.85.xx.xx',
    userAgent: 'Safari / iOS',
    country: 'IN',
  },
  {
    id: '4',
    timestamp: '2024-02-03T13:45:22Z',
    actor: { id: 'u3', name: 'Unknown', email: 'attacker@fake.com', role: 'unknown' },
    action: 'auth.login_failed',
    category: 'auth',
    resource: { type: 'auth', id: 'login' },
    details: 'Failed login attempt - invalid credentials (5 attempts)',
    status: 'failed',
    ip: '45.33.xx.xx',
    userAgent: 'Unknown',
    country: 'US',
  },
  {
    id: '5',
    timestamp: '2024-02-03T13:30:00Z',
    actor: { id: 'u1', name: 'Super Admin', email: 'mail@jsabu.com', role: 'super_admin' },
    action: 'product.approved',
    category: 'products',
    resource: { type: 'product', id: 'p123', name: 'Gold Necklace 22K' },
    details: 'Approved seller product submission',
    status: 'success',
    ip: '182.73.192.xx',
    userAgent: 'Chrome 120 / macOS',
    country: 'IN',
  },
  {
    id: '6',
    timestamp: '2024-02-03T12:15:00Z',
    actor: { id: 'u2', name: 'Rahul Mehta', email: 'rahul@example.com', role: 'country_admin' },
    action: 'refund.processed',
    category: 'payments',
    resource: { type: 'refund', id: 'ref-456', name: 'Refund #456' },
    details: 'Processed refund of ₹25,000 for order ORD-2024-890',
    status: 'success',
    ip: '103.85.xx.xx',
    userAgent: 'Chrome 120 / Windows',
    country: 'IN',
  },
  {
    id: '7',
    timestamp: '2024-02-03T11:00:00Z',
    actor: { id: 'sys', name: 'System', email: 'system@grandgold.com', role: 'system' },
    action: 'security.2fa_disabled',
    category: 'security',
    resource: { type: 'user', id: 'u10', name: 'Suspicious User' },
    details: '2FA was disabled for user account',
    status: 'warning',
    ip: 'N/A',
    userAgent: 'N/A',
  },
];

const categoryConfig = {
  auth: { icon: Shield, color: 'bg-purple-100 text-purple-600' },
  users: { icon: User, color: 'bg-blue-100 text-blue-600' },
  orders: { icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
  products: { icon: Package, color: 'bg-orange-100 text-orange-600' },
  payments: { icon: CreditCard, color: 'bg-pink-100 text-pink-600' },
  settings: { icon: Settings, color: 'bg-gray-100 text-gray-600' },
  security: { icon: AlertCircle, color: 'bg-red-100 text-red-600' },
};

const statusConfig = {
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
};

export default function AuditLogsPage() {
  const [logs] = useState<AuditLog[]>(MOCK_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor.name.toLowerCase().includes(q) ||
        log.actor.email.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.resource.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return {
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Audit Logs' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Track all admin actions and system events</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Events (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {logs.filter((l) => l.status === 'success').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter((l) => l.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter((l) => l.status === 'warning').length}
              </p>
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
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="users">Users</option>
              <option value="orders">Orders</option>
              <option value="products">Products</option>
              <option value="payments">Payments</option>
              <option value="settings">Settings</option>
              <option value="security">Security</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="border-t border-gray-100">
          {filteredLogs.map((log) => {
            const catConfig = categoryConfig[log.category];
            const CatIcon = catConfig.icon;
            const statConfig = statusConfig[log.status];
            const StatIcon = statConfig.icon;
            const ts = formatTimestamp(log.timestamp);
            const isExpanded = expandedId === log.id;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-gray-50 last:border-0"
              >
                <div
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${catConfig.color}`}>
                    <CatIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statConfig.bg} ${statConfig.color}`}>
                        <StatIcon className="w-3 h-3" />
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{log.details}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {ts.date}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {ts.time}
                    </div>
                  </div>

                  <button className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-gray-50 px-4 pb-4"
                  >
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Actor</p>
                        <p className="text-sm font-medium text-gray-900">{log.actor.name}</p>
                        <p className="text-xs text-gray-500">{log.actor.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{log.actor.role.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Resource</p>
                        <p className="text-sm font-medium text-gray-900">{log.resource.name || log.resource.id}</p>
                        <p className="text-xs text-gray-500 capitalize">{log.resource.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPin className="w-4 h-4" />
                          {log.country || 'Unknown'}
                        </div>
                        <p className="text-xs text-gray-500">IP: {log.ip}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Device</p>
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Monitor className="w-4 h-4" />
                          <span className="truncate">{log.userAgent}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} events
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
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
