'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { adminApi, ApiError } from '@/lib/api';

const TICKET_CATEGORIES = [
  { value: 'order', label: 'Order Issue' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'product', label: 'Product Inquiry' },
  { value: 'shipping', label: 'Shipping & Delivery' },
  { value: 'returns', label: 'Returns & Refunds' },
  { value: 'account', label: 'Account Issue' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
];

export default function NewTicketPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    subject: '',
    category: 'order',
    priority: 'medium',
    customerEmail: '',
    customerName: '',
    orderId: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!form.customerEmail.trim()) {
      setError('Customer email is required');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createTicket?.({
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        customerEmail: form.customerEmail,
        customerName: form.customerName,
        orderId: form.orderId || undefined,
        description: form.description,
      }) ?? fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          category: form.category,
          priority: form.priority,
          customerEmail: form.customerEmail,
          customerName: form.customerName,
          orderId: form.orderId || undefined,
          message: form.description,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/support/tickets');
      }, 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Support', href: '/admin/support' },
          { label: 'Tickets', href: '/admin/support/tickets' },
          { label: 'New Ticket' },
        ]}
      />
      <div className="mb-6">
        <Link
          href="/admin/support/tickets"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gold-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Create New Ticket</h1>
        <p className="text-gray-500 mb-6">Create a support ticket on behalf of a customer.</p>

        {success && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span>Ticket created successfully! Redirecting...</span>
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
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                placeholder="customer@example.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related Order ID</label>
            <input
              type="text"
              value={form.orderId}
              onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
              placeholder="ORD-XXXX (optional)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the issue in detail..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              href="/admin/support/tickets"
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
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
