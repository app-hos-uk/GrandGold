'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageCircle,
  Send,
  Users,
  BarChart3,
  Calendar,
  Plus,
  Filter,
  Search,
  ChevronRight,
  Target,
  Zap,
  Bell,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import Link from 'next/link';

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Diwali Gold Sale', channel: 'email', status: 'sent', sentAt: '2024-01-15', recipients: 12500, openRate: 32, clickRate: 8 },
  { id: '2', name: 'New Arrivals - Necklaces', channel: 'email', status: 'scheduled', scheduledAt: '2024-02-10', recipients: 8500 },
  { id: '3', name: 'Abandoned Cart Reminder', channel: 'whatsapp', status: 'sent', sentAt: '2024-01-20', recipients: 3200, openRate: 78 },
  { id: '4', name: 'Price Drop Alert', channel: 'push', status: 'draft', recipients: 0 },
];

const MOCK_SEGMENTS = [
  { id: 's1', name: 'High-value buyers (₹1L+)', count: 1250, criteria: 'LTV > 100000', lastUpdated: '2024-02-01' },
  { id: 's2', name: 'Abandoned cart (7 days)', count: 890, criteria: 'Cart abandoned in 7 days', lastUpdated: '2024-02-03' },
  { id: 's3', name: 'Wishlist non-buyers', count: 2100, criteria: 'Has wishlist, no purchase in 30 days', lastUpdated: '2024-02-02' },
  { id: 's4', name: 'India - Gold lovers', count: 5600, criteria: 'Country=IN, viewed gold category', lastUpdated: '2024-01-28' },
];

const channelConfig = {
  email: { icon: Mail, label: 'Email', color: 'bg-blue-100 text-blue-700' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-100 text-green-700' },
  push: { icon: Bell, label: 'Push', color: 'bg-purple-100 text-purple-700' },
  sms: { icon: Send, label: 'SMS', color: 'bg-orange-100 text-orange-700' },
};

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
  scheduled: { color: 'bg-yellow-100 text-yellow-700', label: 'Scheduled' },
  sent: { color: 'bg-green-100 text-green-700', label: 'Sent' },
};

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'segments' | 'automation'>('campaigns');

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Marketing' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-600">Campaigns, segments, and automation</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing/campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600">
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
          <Link href="/admin/marketing/segments/new" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Target className="w-4 h-4" />
            New Segment
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'campaigns', label: 'Campaigns', icon: Send },
          { id: 'segments', label: 'Segments', icon: Users },
          { id: 'automation', label: 'Automation', icon: Zap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'campaigns' | 'segments' | 'automation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id ? 'bg-gold-50 text-gold-700 border-b-2 border-gold-500' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'campaigns' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search campaigns..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500" />
              </div>
              <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500">
                <option value="">All channels</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="push">Push</option>
              </select>
              <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500">
                <option value="">All status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
              </select>
            </div>
            <div className="divide-y divide-gray-50">
              {MOCK_CAMPAIGNS.map((c) => {
                const ChannelIcon = channelConfig[c.channel as keyof typeof channelConfig]?.icon ?? Mail;
                const statusConf = statusConfig[c.status as keyof typeof statusConfig];
                return (
                  <div key={c.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${channelConfig[c.channel as keyof typeof channelConfig]?.color ?? 'bg-gray-100'}`}>
                        <ChannelIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-sm text-gray-500">
                          {c.recipients.toLocaleString()} recipients
                          {c.sentAt && ` · Sent ${c.sentAt}`}
                          {c.scheduledAt && ` · Scheduled ${c.scheduledAt}`}
                        </p>
                        {c.openRate != null && (
                          <p className="text-xs text-gray-400 mt-1">Open: {c.openRate}% · Click: {c.clickRate}%</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusConf?.color ?? 'bg-gray-100'}`}>
                        {statusConf?.label ?? c.status}
                      </span>
                      <Link href={`/admin/marketing/campaigns/${c.id}`} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'segments' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <input type="text" placeholder="Search segments..." className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500" />
            </div>
            <div className="divide-y divide-gray-50">
              {MOCK_SEGMENTS.map((s) => (
                <div key={s.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.criteria}</p>
                      <p className="text-xs text-gray-400 mt-1">Updated {s.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-gray-900">{s.count.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">users</span>
                    <Link href={`/admin/marketing/segments/${s.id}`} className="p-2 hover:bg-gray-200 rounded-lg">
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'automation' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Automation Rules</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Set up automated flows: abandoned cart emails, welcome series, post-purchase follow-ups, and price-drop alerts.
            </p>
            <button className="mt-6 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600">
              Create automation
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
