'use client';

import { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { adminApi, ApiError } from '@/lib/api';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';
import { useConfirm } from '@/components/admin/confirm-dialog';
import { formatRelativeDate } from '@/lib/format';

interface OnboardingRow {
  id: string;
  userId?: string;
  businessName?: string;
  email?: string;
  country?: string;
  status?: string;
  createdAt?: string;
  appliedAt?: string;
}

export default function AdminOnboardingPage() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [list, setList] = useState<OnboardingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getOnboardingPending({ page, limit: 20, country: countryFilter || undefined })
      .then((res: unknown) => {
        const d = res as { data?: OnboardingRow[]; total?: number };
        const items = Array.isArray(d?.data) ? d.data : [];
        setList(items);
        setTotal(d?.total ?? items.length);
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, countryFilter]);

  const handleApprove = async (id: string) => {
    const ok = await confirm({ title: 'Approve onboarding', message: 'Approve this seller application?', confirmLabel: 'Approve', variant: 'default' });
    if (!ok) return;
    setActioning(id);
    adminApi
      .approveOnboarding(id)
      .then(() => { toast.success('Onboarding approved'); load(); })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Approve failed'))
      .finally(() => setActioning(null));
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    const ok = await confirm({ title: 'Reject onboarding', message: 'Reject this seller application?', confirmLabel: 'Reject', variant: 'danger' });
    if (!ok) return;
    setActioning(id);
    adminApi
      .rejectOnboarding(id, reason || 'Rejected by admin')
      .then(() => { toast.success('Onboarding rejected'); load(); })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Reject failed'))
      .finally(() => setActioning(null));
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Onboarding' }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seller Onboarding</h1>
        <p className="text-gray-600">Review and approve or reject pending seller applications.</p>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
          {total} pending application{total !== 1 ? 's' : ''}
        </span>
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">All Countries</option>
          <option value="IN">IN</option>
          <option value="AE">AE</option>
          <option value="UK">UK</option>
        </select>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No pending onboarding requests.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Business</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Country</th>
                <th className="px-6 py-4 font-medium">Applied</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{row.id}</td>
                  <td className="px-6 py-4">{row.businessName ?? '—'}</td>
                  <td className="px-6 py-4">{row.email ?? '—'}</td>
                  <td className="px-6 py-4">{row.country ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.appliedAt || row.createdAt ? formatRelativeDate(row.appliedAt || row.createdAt!) : '—'}</td>
                  <td className="px-6 py-4">{row.status ?? 'in_review'}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      type="button"
                      disabled={!!actioning}
                      onClick={() => handleApprove(row.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-sm hover:bg-green-200 disabled:opacity-50"
                    >
                      {actioning === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={!!actioning}
                      onClick={() => handleReject(row.id)}
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
    </div>
  );
}
