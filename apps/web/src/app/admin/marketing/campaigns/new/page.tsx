'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Mail, MessageSquare, Bell } from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { adminApi, ApiError } from '@/lib/api';

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email', icon: Mail, description: 'Send promotional emails' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, description: 'Send WhatsApp messages' },
  { value: 'push', label: 'Push Notification', icon: Bell, description: 'Send push notifications' },
];

interface Segment {
  id: string;
  name: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  const [form, setForm] = useState({
    name: '',
    channel: 'email',
    subject: '',
    content: '',
    segmentId: '',
    scheduledAt: '',
    sendNow: true,
  });

  useEffect(() => {
    adminApi.getSegments?.({ limit: 100 })
      .then((res) => {
        const data = res as { data?: Segment[] };
        setSegments(data?.data || []);
      })
      .catch(() => setSegments([]))
      .finally(() => setLoadingSegments(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Campaign name is required');
      return;
    }
    if (form.channel === 'email' && !form.subject.trim()) {
      setError('Email subject is required');
      return;
    }
    if (!form.content.trim()) {
      setError('Content is required');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createCampaign({
        name: form.name,
        channel: form.channel,
        subject: form.channel === 'email' ? form.subject : undefined,
        content: form.content,
        segmentId: form.segmentId || undefined,
        scheduledAt: form.sendNow ? undefined : form.scheduledAt || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/marketing');
      }, 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Marketing', href: '/admin/marketing' },
          { label: 'New Campaign' },
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Create New Campaign</h1>
        <p className="text-gray-500 mb-6">Create email, WhatsApp, or push notification campaigns.</p>

        {success && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span>Campaign created successfully! Redirecting...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Summer Sale Announcement"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {CHANNEL_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = form.channel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, channel: opt.value }))}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-gold-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${isSelected ? 'text-gold-700' : 'text-gray-900'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {form.channel === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Enter email subject line"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder={
                form.channel === 'email'
                  ? 'Enter email body content (HTML supported)...'
                  : 'Enter message content...'
              }
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Segment</label>
            <select
              value={form.segmentId}
              onChange={(e) => setForm((f) => ({ ...f, segmentId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              disabled={loadingSegments}
            >
              <option value="">All customers</option>
              {segments.map((seg) => (
                <option key={seg.id} value={seg.id}>{seg.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to send to all subscribed customers.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.sendNow}
                  onChange={() => setForm((f) => ({ ...f, sendNow: true }))}
                  className="text-gold-500"
                />
                <span className="text-sm">Send immediately</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!form.sendNow}
                  onChange={() => setForm((f) => ({ ...f, sendNow: false }))}
                  className="text-gold-500"
                />
                <span className="text-sm">Schedule for later</span>
              </label>
              {!form.sendNow && (
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              href="/admin/marketing"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-center hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || success}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Creating...' : form.sendNow ? 'Send Now' : 'Schedule Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
