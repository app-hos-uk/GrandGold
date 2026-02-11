'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageCircle,
  Send,
  Users,
  Plus,
  Search,
  ChevronRight,
  Target,
  Zap,
  Bell,
  Loader2,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  recipients: number;
  openRate?: number;
  clickRate?: number;
}

interface SegmentRow {
  id: string;
  name: string;
  count: number;
  criteria: string;
  lastUpdated: string;
}

function segmentCriteriaSummary(criteria: Record<string, unknown> | undefined): string {
  if (!criteria || typeof criteria !== 'object') return '–';
  const keys = Object.keys(criteria);
  if (keys.length === 0) return '–';
  if (keys.length <= 2) return keys.map((k) => `${k}: ${String((criteria as Record<string, unknown>)[k])}`).join(', ');
  return `${keys.length} criteria`;
}

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
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingSegments, setLoadingSegments] = useState(true);

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const res = await adminApi.getCampaigns({ limit: 100 });
      const r = res as { data?: CampaignRow[]; total?: number };
      const list = Array.isArray(r?.data) ? r.data : [];
      setCampaigns(list);
    } catch {
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  const loadSegments = useCallback(async () => {
    setLoadingSegments(true);
    try {
      const res = await adminApi.getSegments({ limit: 100 });
      const r = res as { data?: Array<{ id: string; name: string; criteria?: Record<string, unknown>; count?: number; lastUpdated?: string }>; total?: number };
      const list = Array.isArray(r?.data)
        ? r.data.map((s) => ({
            id: s.id,
            name: s.name,
            count: s.count ?? 0,
            criteria: segmentCriteriaSummary(s.criteria),
            lastUpdated: s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString() : '–',
          }))
        : [];
      setSegments(list);
    } catch {
      setSegments([]);
    } finally {
      setLoadingSegments(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

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
              {loadingCampaigns ? (
                <div className="p-8 flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading campaigns...
                </div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No campaigns yet. Create one to get started.</div>
              ) : (
                campaigns.map((c) => {
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
                            {(c.recipients ?? 0).toLocaleString()} recipients
                            {c.sentAt && ` · Sent ${c.sentAt}`}
                            {c.scheduledAt && ` · Scheduled ${c.scheduledAt}`}
                          </p>
                          {(c.openRate != null || c.clickRate != null) && (
                            <p className="text-xs text-gray-400 mt-1">Open: {c.openRate ?? '–'}% · Click: {c.clickRate ?? '–'}%</p>
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
                })
              )}
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
              {loadingSegments ? (
                <div className="p-8 flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading segments...
                </div>
              ) : segments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No segments yet. Create one to get started.</div>
              ) : (
                segments.map((s) => (
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
                      <span className="text-lg font-semibold text-gray-900">{(s.count ?? 0).toLocaleString()}</span>
                      <span className="text-sm text-gray-500">users</span>
                      <Link href={`/admin/marketing/segments/${s.id}`} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
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
