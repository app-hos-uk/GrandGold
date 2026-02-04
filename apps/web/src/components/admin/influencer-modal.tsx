'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import type { InfluencerRack } from '@/lib/api';

export interface InfluencerFormData {
  slug: string;
  name: string;
  bio: string;
  commissionRate: number;
  productIds: string[];
}

const defaultForm: InfluencerFormData = {
  slug: '',
  name: '',
  bio: '',
  commissionRate: 5,
  productIds: [],
};

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export interface InfluencerModalProps {
  /** null = Add mode, rack = Edit mode */
  initialRack: InfluencerRack | null;
  onClose: () => void;
  onSubmit: (data: InfluencerFormData) => Promise<void>;
  submitting: boolean;
  success: string | null;
  error: string | null;
}

export function InfluencerModal({
  initialRack,
  onClose,
  onSubmit,
  submitting,
  success,
  error,
}: InfluencerModalProps) {
  const isEdit = initialRack !== null;
  const [form, setForm] = useState<InfluencerFormData>(defaultForm);

  useEffect(() => {
    if (initialRack) {
      setForm({
        slug: initialRack.slug,
        name: initialRack.name,
        bio: initialRack.bio ?? '',
        commissionRate: initialRack.commissionRate ?? 5,
        productIds: initialRack.productIds ?? [],
      });
    } else {
      setForm(defaultForm);
    }
  }, [initialRack]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      ...(isEdit ? {} : { slug: slugFromName(name) }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug.trim();
    const name = form.name.trim();
    if (!slug || !name) return;
    onSubmit({
      ...form,
      slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      name,
      bio: form.bio.trim(),
      commissionRate: Math.min(100, Math.max(0, form.commissionRate)),
      productIds: form.productIds.filter(Boolean),
    });
  };

  const productIdsStr = form.productIds.join(', ');
  const setProductIdsStr = (s: string) =>
    setForm((prev) => ({
      ...prev,
      productIds: s
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean),
    }));

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
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gold-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Influencer' : 'Add Influencer'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Priya's Picks"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
            <input
              required
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') }))}
              placeholder="e.g. priya-picks"
              disabled={isEdit}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {isEdit && (
              <p className="text-xs text-gray-500 mt-1">Slug cannot be changed when editing.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Short description for the influencer storefront"
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={form.commissionRate}
              onChange={(e) => setForm((prev) => ({ ...prev, commissionRate: Number(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product IDs (optional)</label>
            <input
              type="text"
              value={productIdsStr}
              onChange={(e) => setProductIdsStr(e.target.value)}
              placeholder="e.g. 1, 3, 5, 2"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated product IDs to feature in this rack.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Influencer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
