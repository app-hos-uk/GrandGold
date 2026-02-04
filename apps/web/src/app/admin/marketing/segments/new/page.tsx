'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Plus, X, Users } from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { adminApi, ApiError } from '@/lib/api';

const CRITERIA_TYPES = [
  { value: 'total_spent', label: 'Total Spent', type: 'number' },
  { value: 'order_count', label: 'Order Count', type: 'number' },
  { value: 'last_order_days', label: 'Days Since Last Order', type: 'number' },
  { value: 'country', label: 'Country', type: 'select', options: ['IN', 'AE', 'UK'] },
  { value: 'kyc_status', label: 'KYC Status', type: 'select', options: ['verified', 'pending', 'none'] },
  { value: 'registration_days', label: 'Days Since Registration', type: 'number' },
  { value: 'cart_abandoned', label: 'Has Abandoned Cart', type: 'boolean' },
  { value: 'newsletter_subscribed', label: 'Newsletter Subscribed', type: 'boolean' },
];

const OPERATORS = {
  number: [
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater or equal' },
    { value: 'lt', label: 'Less than' },
    { value: 'lte', label: 'Less or equal' },
    { value: 'eq', label: 'Equals' },
  ],
  select: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
  ],
  boolean: [
    { value: 'eq', label: 'Is' },
  ],
};

interface Criterion {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean;
}

export default function NewSegmentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', field: 'total_spent', operator: 'gt', value: 10000 },
  ]);

  const addCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      { id: String(Date.now()), field: 'total_spent', operator: 'gt', value: 0 },
    ]);
  };

  const removeCriterion = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCriterion = (id: string, updates: Partial<Criterion>) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Segment name is required');
      return;
    }
    if (criteria.length === 0) {
      setError('At least one criterion is required');
      return;
    }

    setSubmitting(true);
    try {
      const criteriaObj: Record<string, { operator: string; value: unknown }> = {};
      criteria.forEach((c) => {
        criteriaObj[c.field] = { operator: c.operator, value: c.value };
      });

      await adminApi.createSegment({
        name: form.name,
        criteria: criteriaObj,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/marketing');
      }, 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create segment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Marketing', href: '/admin/marketing' },
          { label: 'New Segment' },
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Create New Segment</h1>
            <p className="text-gray-500 text-sm">Define customer segments for targeted campaigns.</p>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span>Segment created successfully! Redirecting...</span>
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
              Segment Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., High-Value Customers"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criteria <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {criteria.map((c) => {
                const fieldConfig = CRITERIA_TYPES.find((ct) => ct.value === c.field);
                const fieldType = fieldConfig?.type || 'number';
                const operators = OPERATORS[fieldType as keyof typeof OPERATORS] || OPERATORS.number;

                return (
                  <div key={c.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <select
                      value={c.field}
                      onChange={(e) => updateCriterion(c.id, { field: e.target.value, value: fieldType === 'boolean' ? true : 0 })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      {CRITERIA_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>{ct.label}</option>
                      ))}
                    </select>

                    <select
                      value={c.operator}
                      onChange={(e) => updateCriterion(c.id, { operator: e.target.value })}
                      className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>

                    {fieldType === 'number' && (
                      <input
                        type="number"
                        value={c.value as number}
                        onChange={(e) => updateCriterion(c.id, { value: parseFloat(e.target.value) || 0 })}
                        className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    )}

                    {fieldType === 'select' && (
                      <select
                        value={c.value as string}
                        onChange={(e) => updateCriterion(c.id, { value: e.target.value })}
                        className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        {fieldConfig?.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {fieldType === 'boolean' && (
                      <select
                        value={c.value ? 'true' : 'false'}
                        onChange={(e) => updateCriterion(c.id, { value: e.target.value === 'true' })}
                        className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    )}

                    {criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterion(c.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addCriterion}
              className="mt-3 inline-flex items-center gap-2 text-sm text-gold-600 hover:text-gold-700"
            >
              <Plus className="w-4 h-4" />
              Add Criterion
            </button>
            <p className="text-xs text-gray-500 mt-2">
              All criteria must match (AND logic).
            </p>
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
              {submitting ? 'Creating...' : 'Create Segment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
