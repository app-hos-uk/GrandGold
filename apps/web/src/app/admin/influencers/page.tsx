'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ExternalLink,
  BarChart3,
  Package,
  Plus,
  User,
  TrendingUp,
  Pencil,
  Loader2,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { InfluencerModal } from '@/components/admin/influencer-modal';
import { influencerApi, type InfluencerRack } from '@/lib/api';
import { useToast } from '@/components/admin/toast';
import type { InfluencerFormData } from '@/components/admin/influencer-modal';

const FALLBACK_RACKS: InfluencerRack[] = [
  { slug: 'priya', name: "Priya's Picks", bio: 'Bridal & traditional jewellery curated by fashion influencer Priya', productIds: ['1', '3', '5', '2'], commissionRate: 5 },
  { slug: 'rahul', name: "Rahul's Collection", bio: 'Contemporary & investment pieces selected by Rahul', productIds: ['3', '7', '4', '6'], commissionRate: 5 },
];

export default function AdminInfluencersPage() {
  const toast = useToast();
  const [selectedCountry] = useState<'IN' | 'AE' | 'UK'>('IN');
  const [racks, setRacks] = useState<InfluencerRack[]>(FALLBACK_RACKS);
  const [loading, setLoading] = useState(true);
  const [modalRack, setModalRack] = useState<InfluencerRack | null | 'add'>(null);
  const [commissionRack, setCommissionRack] = useState<InfluencerRack | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRacks = () => {
    setLoading(true);
    influencerApi
      .listRacks()
      .then((list) => setRacks(list.length ? list : FALLBACK_RACKS))
      .catch(() => setRacks(FALLBACK_RACKS))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRacks();
  }, []);

  const handleModalSubmit = async (data: InfluencerFormData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (modalRack === 'add' || modalRack === null) {
        await influencerApi.createRack({
          slug: data.slug,
          name: data.name,
          bio: data.bio || undefined,
          productIds: data.productIds.length ? data.productIds : undefined,
          commissionRate: data.commissionRate,
          ...(data.commissionType && { commissionType: data.commissionType }),
        });
        setSuccess('Influencer created. Storefront available at /[country]/influencer/' + data.slug);
        toast.success('Influencer created');
      } else {
        await influencerApi.updateRack(modalRack.slug, {
          name: data.name,
          bio: data.bio || undefined,
          productIds: data.productIds.length ? data.productIds : undefined,
          commissionRate: data.commissionRate,
          ...(data.commissionType && { commissionType: data.commissionType }),
        });
        setSuccess('Influencer updated.');
        toast.success('Influencer updated');
      }
      loadRacks();
      setTimeout(() => {
        setModalRack(null);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save influencer';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Influencer Marketing' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Influencer Marketing</h1>
          <p className="text-gray-600">Manage influencer racks, commissions, and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setModalRack('add'); setError(null); setSuccess(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Influencer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-gold-600" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">{loading ? '…' : racks.length}</span>
          </div>
          <p className="text-sm text-gray-500">Active Influencers</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">Racks</span>
          </div>
          <p className="text-sm text-gray-500">Curated product racks</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">Commissions</span>
          </div>
          <p className="text-sm text-gray-500">Track & pay commissions</p>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Influencers</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
            </div>
          ) : (
            racks.map((inf) => (
              <div
                key={inf.slug}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{inf.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{inf.bio}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{(inf.productIds ?? []).length} products in rack</span>
                      <span>
                        {(inf.commissionRate ?? 5) > 0
                          ? `${inf.commissionRate ?? 5}% commission`
                          : 'No commission'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setModalRack(inf); setError(null); setSuccess(null); }}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                    title="Edit influencer"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <Link
                    href={`/${selectedCountry.toLowerCase()}/influencer/${inf.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Storefront
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCommissionRack(inf)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold-50 text-gold-700 rounded-lg hover:bg-gold-100"
                    title="View commission summary"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Commission
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
          Add or edit influencers above. Storefronts are available at /[country]/influencer/[slug].
        </div>
      </div>

      <AnimatePresence>
        {modalRack !== null && (
          <InfluencerModal
            key="influencer-modal"
            initialRack={modalRack === 'add' ? null : modalRack}
            onClose={() => { setModalRack(null); setError(null); setSuccess(null); }}
            onSubmit={handleModalSubmit}
            submitting={submitting}
            success={success}
            error={error}
          />
        )}
      </AnimatePresence>

      {/* Commission Modal */}
      <AnimatePresence>
        {commissionRack && (
          <CommissionModal
            key="commission-modal"
            influencer={commissionRack}
            onClose={() => setCommissionRack(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CommissionModal({
  influencer,
  onClose,
}: {
  influencer: InfluencerRack;
  onClose: () => void;
}) {
  // Mock commission data - in production, fetch from API
  const commissionData = {
    totalEarnings: 45000,
    pendingPayout: 12500,
    lastPayout: 32500,
    lastPayoutDate: '2024-01-15',
    conversionRate: 3.2,
    totalClicks: 1250,
    totalOrders: 40,
    avgOrderValue: 18500,
    monthlyData: [
      { month: 'Oct', earnings: 8500, orders: 8 },
      { month: 'Nov', earnings: 12000, orders: 11 },
      { month: 'Dec', earnings: 15000, orders: 14 },
      { month: 'Jan', earnings: 9500, orders: 7 },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Commission Summary</h2>
              <p className="text-gray-500">{influencer.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-700">₹{commissionData.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="bg-gold-50 rounded-lg p-4">
              <p className="text-sm text-gold-600">Pending Payout</p>
              <p className="text-2xl font-bold text-gold-700">₹{commissionData.pendingPayout.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-700">{commissionData.totalOrders}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-purple-700">{commissionData.conversionRate}%</p>
            </div>
          </div>

          {/* Commission Rate */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Commission Rate</p>
                <p className="text-lg font-semibold text-gray-900">{influencer.commissionRate || 5}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Order Value</p>
                <p className="text-lg font-semibold text-gray-900">₹{commissionData.avgOrderValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Clicks</p>
                <p className="text-lg font-semibold text-gray-900">{commissionData.totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                    <th className="pb-2 font-medium">Month</th>
                    <th className="pb-2 font-medium text-right">Orders</th>
                    <th className="pb-2 font-medium text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionData.monthlyData.map((row) => (
                    <tr key={row.month} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{row.month}</td>
                      <td className="py-3 text-gray-600 text-right">{row.orders}</td>
                      <td className="py-3 text-gray-900 font-medium text-right">₹{row.earnings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Last Payout */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Last payout: <span className="font-medium text-gray-700">₹{commissionData.lastPayout.toLocaleString()}</span> on {new Date(commissionData.lastPayoutDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-white"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600">
            Process Payout
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
