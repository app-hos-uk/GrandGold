'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Receipt, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { adminApi, ApiError } from '@/lib/api';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';
import { useConfirm } from '@/components/admin/confirm-dialog';
import { formatRelativeDate, formatCurrency } from '@/lib/format';

interface RefundRow {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  reasonCategory?: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'other';
  amount?: number;
  requestedAmount?: number;
  status: string;
  createdAt?: string;
  customerEmail?: string;
  preferredResolution?: 'refund' | 'exchange' | 'store_credit';
  qcStatus?: 'pending' | 'approved' | 'rejected';
  internalNotes?: string;
}

const RETURN_REASON_LABELS: Record<string, string> = {
  defective: 'Defective',
  wrong_item: 'Wrong item received',
  not_as_described: 'Not as described',
  changed_mind: 'Changed mind',
  other: 'Other',
};

export default function AdminRefundsPage() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<RefundRow | null>(null);
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getRefundsPending({ page, limit: 20 })
      .then((res: unknown) => {
        const d = res as { data?: RefundRow[]; total?: number };
        const list = Array.isArray(d?.data) ? d.data : [];
        setRefunds(list);
        setTotal(d?.total ?? list.length);
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const openApproveModal = (r: RefundRow) => {
    setApproveModal(r);
    setPartialAmount(r.amount != null ? String(r.amount) : '');
    setInternalNotes(r.internalNotes ?? '');
  };

  const handleApprove = async (refundId: string) => {
    const amount = partialAmount ? parseFloat(partialAmount) : undefined;
    setActioning(refundId);
    adminApi
      .approveRefund(refundId, {
        partialAmount: amount,
        internalNotes: internalNotes || undefined,
      })
      .then(() => {
        toast.success(amount != null ? 'Partial refund approved' : 'Refund approved');
        setApproveModal(null);
        load();
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Approve failed'))
      .finally(() => setActioning(null));
  };

  const confirmApprove = () => {
    if (!approveModal) return;
    const ok = partialAmount
      ? !isNaN(parseFloat(partialAmount)) && parseFloat(partialAmount) >= 0
      : true;
    if (!ok) {
      toast.error('Enter a valid refund amount');
      return;
    }
    handleApprove(approveModal.id);
  };

  const handleReject = async (refundId: string) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    const ok = await confirm({ title: 'Reject refund', message: 'Reject this refund request?', confirmLabel: 'Reject', variant: 'danger' });
    if (!ok) return;
    setActioning(refundId);
    adminApi
      .rejectRefund(refundId, reason || 'Rejected by admin')
      .then(() => { toast.success('Refund rejected'); load(); })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Reject failed'))
      .finally(() => setActioning(null));
  };

  const pendingAmount = refunds.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Refunds' }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Refund Requests</h1>
        <p className="text-gray-600">Approve or reject pending refund requests.</p>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
          {total} pending request{total !== 1 ? 's' : ''}
        </span>
        {total > 0 && (
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
            {formatCurrency(pendingAmount)} in pending refunds
          </span>
        )}
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No pending refund requests.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Refund ID</th>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">User / Email</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Requested</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{r.id}</td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/orders?order=${r.orderId}`} className="text-gold-600 hover:text-gold-700 font-medium">{r.orderId}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">{r.userId}</span>
                    {r.customerEmail && <p className="text-xs text-gray-500">{r.customerEmail}</p>}
                  </td>
                  <td className="px-6 py-4">{r.amount != null ? formatCurrency(Number(r.amount)) : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{r.createdAt ? formatRelativeDate(r.createdAt) : '—'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {RETURN_REASON_LABELS[r.reasonCategory as keyof typeof RETURN_REASON_LABELS] || r.reasonCategory || 'Other'}
                    </span>
                    {r.reason && <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{r.reason}</p>}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      type="button"
                      disabled={!!actioning}
                      onClick={() => openApproveModal(r)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-sm hover:bg-green-200 disabled:opacity-50"
                    >
                      {actioning === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={!!actioning}
                      onClick={() => handleReject(r.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-sm hover:bg-red-200 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 20 && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total: {total}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-sm text-gold-600 disabled:opacity-50">Previous</button>
              <button type="button" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="text-sm text-gold-600 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
      {dialog}

      {/* Approve refund modal - partial refund & QC notes */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setApproveModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve refund</h3>
            <p className="text-sm text-gray-500 mb-2">Order: {approveModal.orderId}</p>
            <p className="text-sm text-gray-500 mb-4">Requested: {approveModal.amount != null ? formatCurrency(Number(approveModal.amount)) : 'Full'}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund amount (₹) — leave empty for full</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder={String(approveModal.amount ?? '')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal notes (QC / reason)</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setApproveModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={confirmApprove} disabled={!!actioning} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {actioning === approveModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
