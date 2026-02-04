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
        });
        setSuccess('Influencer created. Storefront available at /[country]/influencer/' + data.slug);
        toast.success('Influencer created');
      } else {
        await influencerApi.updateRack(modalRack.slug, {
          name: data.name,
          bio: data.bio || undefined,
          productIds: data.productIds.length ? data.productIds : undefined,
          commissionRate: data.commissionRate,
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
                      <span>{inf.commissionRate ?? 5}% commission</span>
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold-50 text-gold-700 rounded-lg hover:bg-gold-100"
                    title="Commission summary – coming soon"
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
    </div>
  );
}
