'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Users, Edit2, Trash2, Mail, Save, X } from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { ApiError } from '@/lib/api';

interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria: Record<string, { operator: string; value: unknown }>;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

const CRITERIA_LABELS: Record<string, string> = {
  total_spent: 'Total Spent',
  order_count: 'Order Count',
  last_order_days: 'Days Since Last Order',
  country: 'Country',
  kyc_status: 'KYC Status',
  registration_days: 'Days Since Registration',
  cart_abandoned: 'Has Abandoned Cart',
  newsletter_subscribed: 'Newsletter Subscribed',
};

const OPERATOR_LABELS: Record<string, string> = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  eq: '=',
  neq: '!=',
};

export default function SegmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [segment, setSegment] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchSegment = async () => {
      try {
        const res = await fetch(`/api/marketing/segments/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('grandgold_token')}` },
        });
        if (!res.ok) throw new Error('Segment not found');
        const data = await res.json();
        setSegment(data?.data || data);
        setEditName(data?.data?.name || data?.name || '');
        setEditDescription(data?.data?.description || data?.description || '');
      } catch {
        // Use mock data for demo
        const mockSegment: Segment = {
          id,
          name: 'High-Value Customers',
          description: 'Customers who have spent more than 50,000',
          criteria: {
            total_spent: { operator: 'gt', value: 50000 },
            order_count: { operator: 'gte', value: 3 },
          },
          userCount: 342,
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        };
        setSegment(mockSegment);
        setEditName(mockSegment.name);
        setEditDescription(mockSegment.description || '');
      } finally {
        setLoading(false);
      }
    };

    fetchSegment();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this segment? Campaigns using this segment will be affected.')) return;

    setActionLoading(true);
    try {
      await fetch(`/api/marketing/segments/${id}`, { method: 'DELETE' });
      router.push('/admin/marketing');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete segment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setError('Segment name is required');
      return;
    }

    setActionLoading(true);
    try {
      await fetch(`/api/marketing/segments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });
      setSegment((s) => s ? { ...s, name: editName, description: editDescription } : s);
      setSuccessMessage('Segment updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update segment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Segment not found</h1>
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
          { label: segment.name },
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
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Segment name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-lg font-semibold"
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={actionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gold-500 text-white rounded-lg text-sm hover:bg-gold-600"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-semibold text-gray-900">{segment.name}</h1>
                  {segment.description && (
                    <p className="text-gray-500 mt-1">{segment.description}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    {segment.userCount.toLocaleString()} customers match this segment
                  </p>
                </>
              )}
            </div>
          </div>
          {!editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <Link
                href={`/admin/marketing/campaigns/new?segment=${id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                <Mail className="w-4 h-4" />
                Create Campaign
              </Link>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Criteria */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Segment Criteria</h2>
        <div className="space-y-2">
          {Object.entries(segment.criteria).map(([field, { operator, value }]) => (
            <div key={field} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">
                {CRITERIA_LABELS[field] || field}
              </span>
              <span className="text-gray-500">
                {OPERATOR_LABELS[operator] || operator}
              </span>
              <span className="font-medium text-gray-900">
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          All criteria must match (AND logic).
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Matching Customers</p>
          <p className="text-2xl font-bold text-gray-900">{segment.userCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Created</p>
          <p className="text-sm font-medium text-gray-900">{new Date(segment.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Last Updated</p>
          <p className="text-sm font-medium text-gray-900">{new Date(segment.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
