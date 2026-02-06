'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Sparkles,
  Filter,
} from 'lucide-react';
import { adminApi, ApiError } from '@/lib/api';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';
import { useConfirm } from '@/components/admin/confirm-dialog';
import { formatRelativeDate } from '@/lib/format';

interface KycApp {
  userId: string;
  tier?: number | string;
  status?: string;
  tier2?: { address?: { country?: string }; data?: { fullName?: string } };
  submittedAt?: string;
  createdAt?: string;
}

interface UserInfo {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface EnrichedApp extends KycApp {
  user?: UserInfo;
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'seller', label: 'Seller' },
  { value: 'customer', label: 'Customer' },
];

export default function AdminKycPage() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [applications, setApplications] = useState<EnrichedApp[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [influencers, setInfluencers] = useState<Array<UserInfo & { kycStatus?: string; kycTier?: number }>>([]);
  const [influencersLoading, setInfluencersLoading] = useState(false);

  const loadPending = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .getKycPending({
        page,
        limit: 20,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        country: countryFilter || undefined,
      })
      .then(async (res: unknown) => {
        const d = res as { data?: KycApp[]; applications?: KycApp[]; total?: number };
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d?.applications) ? d.applications : [];
        const userIds = [...new Set(list.map((a) => a.userId))];
        let userMap: Record<string, UserInfo> = {};
        if (userIds.length > 0) {
          try {
            const userRes = await adminApi.getUsersByIds(userIds);
            const u = userRes as { data?: { users?: UserInfo[] }; users?: UserInfo[] };
            const users = u?.data?.users ?? u?.users ?? [];
            userMap = (users as UserInfo[]).reduce((acc, u) => {
              acc[u.id] = u;
              return acc;
            }, {} as Record<string, UserInfo>);
          } catch {
            // ignore
          }
        }
        const enriched: EnrichedApp[] = list.map((a) => ({
          ...a,
          user: userMap[a.userId],
        }));
        setApplications(enriched);
        setTotal(d?.total ?? list.length);
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [page, tierFilter, countryFilter]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const loadInfluencers = useCallback(() => {
    setInfluencersLoading(true);
    adminApi
      .getUsers({ role: 'influencer', limit: 100 })
      .then(async (res: unknown) => {
        const d = res as { data?: { users?: UserInfo[] }; users?: UserInfo[] };
        const list = (d?.data?.users ?? d?.users ?? []) as UserInfo[];
        const withKyc = await Promise.all(
          list.map(async (u) => {
            try {
              const kyc = await adminApi.getUserKyc(u.id);
              const k = kyc as { status?: string; tier?: string } | null;
              return {
                ...u,
                kycStatus: k?.status ?? 'not_started',
                kycTier: k?.tier === 'tier2' ? 2 : k?.tier === 'tier1' ? 1 : 0,
              };
            } catch {
              return { ...u, kycStatus: 'not_started', kycTier: 0 };
            }
          })
        );
        setInfluencers(withKyc);
      })
      .catch(() => setInfluencers([]))
      .finally(() => setInfluencersLoading(false));
  }, []);

  useEffect(() => {
    loadInfluencers();
  }, [loadInfluencers]);

  const filteredApplications =
    roleFilter === 'all'
      ? applications
      : applications.filter((a) => (a.user?.role ?? '').toLowerCase() === roleFilter);

  const handleApprove = async (userId: string, tier: number) => {
    const ok = await confirm({
      title: 'Approve KYC',
      message: `Approve KYC for user ${userId}?`,
      confirmLabel: 'Approve',
      variant: 'default',
    });
    if (!ok) return;
    setActioning(userId);
    adminApi
      .approveKyc(userId, tier)
      .then(() => {
        toast.success('KYC approved');
        loadPending();
        loadInfluencers();
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Approve failed'))
      .finally(() => setActioning(null));
  };

  const handleReject = async (userId: string, tier: number) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    const ok = await confirm({
      title: 'Reject KYC',
      message: 'Reject this KYC application?',
      confirmLabel: 'Reject',
      variant: 'danger',
    });
    if (!ok) return;
    setActioning(userId);
    adminApi
      .rejectKyc(userId, tier, reason || 'Rejected by admin')
      .then(() => {
        toast.success('KYC rejected');
        loadPending();
        loadInfluencers();
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Reject failed'))
      .finally(() => setActioning(null));
  };

  const tierNum = (app: KycApp) => (app.tier === 'tier2' || app.tier === 2 ? 2 : 1);

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'KYC' }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KYC Applications</h1>
        <p className="text-gray-600">
          Review and approve KYC for customers, sellers, and influencers. Influencers must complete KYC before receiving commissions.
        </p>
      </div>

      {/* Influencer KYC – required section */}
      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">Influencer KYC</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Influencers are required to complete Tier 2 KYC before they can receive commissions. Review and approve below.
        </p>
        {influencersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : influencers.length === 0 ? (
          <p className="text-sm text-gray-500">No users with Influencer role yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-amber-200">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">KYC Status</th>
                  <th className="pb-2 pr-4 font-medium">Tier</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((u) => (
                  <tr key={u.id} className="border-b border-amber-100">
                    <td className="py-3 pr-4">
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="py-3 pr-4">{u.email ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          u.kycStatus === 'verified'
                            ? 'text-green-600'
                            : u.kycStatus === 'pending'
                              ? 'text-amber-600'
                              : 'text-gray-500'
                        }
                      >
                        {u.kycStatus === 'verified'
                          ? 'Verified'
                          : u.kycStatus === 'pending'
                            ? 'Pending'
                            : u.kycStatus === 'rejected'
                              ? 'Rejected'
                              : 'Not started'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{u.kycTier ? `Tier ${u.kycTier}` : '—'}</td>
                    <td className="py-3">
                      <Link
                        href={`/admin/users?search=${encodeURIComponent(u.email ?? u.id)}`}
                        className="text-gold-600 hover:text-gold-700 text-sm"
                      >
                        View user
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending applications */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
          {total} pending application{total !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          Filter:
        </span>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="all">All Tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
        </select>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All Countries</option>
          <option value="IN">IN</option>
          <option value="AE">AE</option>
          <option value="UK">UK</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
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
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>
              {applications.length === 0
                ? 'No pending KYC applications.'
                : `No pending applications for role "${roleFilter}".`}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Tier</th>
                <th className="px-6 py-4 font-medium">Country</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => (
                <tr key={app.userId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <Link
                          href={`/admin/users?search=${encodeURIComponent(app.userId)}`}
                          className="text-gold-600 hover:text-gold-700 font-medium"
                        >
                          {app.user
                            ? [app.user.firstName, app.user.lastName].filter(Boolean).join(' ') || app.user.email
                            : app.userId}
                        </Link>
                        {app.user?.email && (
                          <p className="text-xs text-gray-500">{app.user.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        app.user?.role === 'influencer'
                          ? 'bg-amber-100 text-amber-800'
                          : app.user?.role === 'seller'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {app.user?.role ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{tierNum(app)}</td>
                  <td className="px-6 py-4">{app.tier2?.address?.country ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {app.submittedAt || app.createdAt
                      ? formatRelativeDate(app.submittedAt || app.createdAt!)
                      : '—'}
                  </td>
                  <td className="px-6 py-4">{app.status ?? 'pending_review'}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      type="button"
                      disabled={!!actioning}
                      onClick={() => handleApprove(app.userId, tierNum(app))}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-sm hover:bg-green-200 disabled:opacity-50"
                    >
                      {actioning === app.userId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={!!actioning}
                      onClick={() => handleReject(app.userId, tierNum(app))}
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
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-sm text-gold-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="text-sm text-gold-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
