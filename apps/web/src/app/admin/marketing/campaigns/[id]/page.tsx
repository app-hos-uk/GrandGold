'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Mail, MessageSquare, Bell, Play, Pause, Trash2, Edit2, Users, Clock, BarChart3 } from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { adminApi, ApiError } from '@/lib/api';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  content: string;
  status: string;
  segmentId?: string;
  segmentName?: string;
  scheduledAt?: string;
  sentAt?: string;
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  createdAt: string;
}

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageSquare,
  push: Bell,
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  paused: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Fetch campaign details
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/marketing/campaigns/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('grandgold_token')}` },
        });
        if (!res.ok) throw new Error('Campaign not found');
        const data = await res.json();
        setCampaign(data?.data || data);
      } catch {
        // Use mock data for demo
        setCampaign({
          id,
          name: 'Summer Sale Campaign',
          channel: 'email',
          subject: 'Exclusive Summer Deals Just for You!',
          content: '<h1>Summer Sale</h1><p>Get up to 30% off on selected jewelry...</p>',
          status: 'sent',
          segmentName: 'High-Value Customers',
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          stats: {
            sent: 1250,
            delivered: 1180,
            opened: 456,
            clicked: 89,
          },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleAction = async (action: 'pause' | 'resume' | 'delete') => {
    if (action === 'delete' && !confirm('Delete this campaign? This cannot be undone.')) return;

    setActionLoading(true);
    try {
      if (action === 'delete') {
        await fetch(`/api/marketing/campaigns/${id}`, { method: 'DELETE' });
        router.push('/admin/marketing');
      } else {
        await fetch(`/api/marketing/campaigns/${id}/${action}`, { method: 'POST' });
        setSuccessMessage(`Campaign ${action === 'pause' ? 'paused' : 'resumed'}`);
        setCampaign((c) => c ? { ...c, status: action === 'pause' ? 'paused' : 'sending' } : c);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${action} campaign`);
    } finally {
      setActionLoading(false);
    }
  };

  const ChannelIcon = campaign ? CHANNEL_ICONS[campaign.channel] || Mail : Mail;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Campaign not found</h1>
        <Link href="/admin/marketing" className="text-gold-600 hover:text-gold-700 mt-4 inline-block">
          Back to Marketing
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Marketing', href: '/admin/marketing' },
          { label: campaign.name },
        ]}
      />
      <div className="mb-6">
        <Link
          href="/admin/marketing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gold-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketing
        </Link>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-green-50 text-green-700 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
              <ChannelIcon className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">{campaign.name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[campaign.status] || 'bg-gray-100'}`}>
                  {campaign.status}
                </span>
              </div>
              <p className="text-gray-500 mt-1 capitalize">{campaign.channel} Campaign</p>
              {campaign.segmentName && (
                <p className="text-sm text-gray-400 mt-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  {campaign.segmentName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === 'sending' && (
              <button
                onClick={() => handleAction('pause')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            {campaign.status === 'paused' && (
              <button
                onClick={() => handleAction('resume')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
            {campaign.status === 'draft' && (
              <Link
                href={`/admin/marketing/campaigns/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Link>
            )}
            <button
              onClick={() => handleAction('delete')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {campaign.stats && (
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Sent', value: campaign.stats.sent, icon: Mail },
            { label: 'Delivered', value: campaign.stats.delivered, pct: campaign.stats.sent > 0 ? ((campaign.stats.delivered / campaign.stats.sent) * 100).toFixed(1) : 0 },
            { label: 'Opened', value: campaign.stats.opened, pct: campaign.stats.delivered > 0 ? ((campaign.stats.opened / campaign.stats.delivered) * 100).toFixed(1) : 0 },
            { label: 'Clicked', value: campaign.stats.clicked, pct: campaign.stats.opened > 0 ? ((campaign.stats.clicked / campaign.stats.opened) * 100).toFixed(1) : 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              {stat.pct !== undefined && (
                <p className="text-sm text-green-600">{stat.pct}%</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Content Preview</h2>
        {campaign.subject && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Subject</p>
            <p className="text-gray-900 font-medium">{campaign.subject}</p>
          </div>
        )}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {campaign.channel === 'email' ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: campaign.content }}
            />
          ) : (
            <p className="whitespace-pre-wrap">{campaign.content}</p>
          )}
        </div>
        {campaign.sentAt && (
          <p className="text-sm text-gray-500 mt-4">
            <Clock className="w-4 h-4 inline mr-1" />
            Sent on {new Date(campaign.sentAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
