'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Percent,
  Zap,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  X,
  Check,
  Loader2,
  Calendar,
  Copy,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';
import { formatCurrency } from '@/lib/format';
import { api } from '@/lib/api';

type TabId = 'coupons' | 'automatic' | 'flash';

interface CouponRow {
  id: string;
  code: string;
  description?: string;
  type: string;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  status: string;
  startsAt?: string;
  endsAt?: string;
  countries: string[];
  createdAt: string;
}

interface AutoDiscountRow {
  id: string;
  name: string;
  type: string;
  value: number;
  minOrderAmount?: number;
  isActive: boolean;
  priority: number;
  startsAt?: string;
  endsAt?: string;
  countries: string[];
}

interface FlashSaleRow {
  id: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  countries: string[];
}

const tabs: { id: TabId; label: string; icon: typeof Tag }[] = [
  { id: 'coupons', label: 'Coupons', icon: Tag },
  { id: 'automatic', label: 'Automatic Discounts', icon: Percent },
  { id: 'flash', label: 'Flash Sales', icon: Zap },
];

const typeLabels: Record<string, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed amount',
  free_shipping: 'Free shipping',
  bogo: 'Buy one get one',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  disabled: 'Disabled',
};

export default function AdminPromotionsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('coupons');
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [autoDiscounts, setAutoDiscounts] = useState<AutoDiscountRow[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'coupon' | 'auto' | 'flash' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCoupons = () => {
    api.get<{ data: CouponRow[]; total: number }>('/api/promotions/coupons?limit=100').then((res) => {
      setCoupons(Array.isArray(res?.data) ? res.data : []);
    }).catch(() => setCoupons([]));
  };
  const loadAuto = () => {
    api.get<{ data: AutoDiscountRow[]; total: number }>('/api/promotions/automatic?limit=100').then((res) => {
      setAutoDiscounts(Array.isArray(res?.data) ? res.data : []);
    }).catch(() => setAutoDiscounts([]));
  };
  const loadFlash = () => {
    api.get<{ data: FlashSaleRow[]; total: number }>('/api/promotions/flash-sales?limit=100').then((res) => {
      setFlashSales(Array.isArray(res?.data) ? res.data : []);
    }).catch(() => setFlashSales([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCoupons(), loadAuto(), loadFlash()]).finally(() => setLoading(false));
  }, []);

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/api/promotions/coupons/${id}`);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteAuto = async (id: string) => {
    if (!confirm('Delete this automatic discount?')) return;
    try {
      await api.delete(`/api/promotions/automatic/${id}`);
      toast.success('Discount deleted');
      loadAuto();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteFlash = async (id: string) => {
    if (!confirm('Delete this flash sale?')) return;
    try {
      await api.delete(`/api/promotions/flash-sales/${id}`);
      toast.success('Flash sale deleted');
      loadFlash();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Promotions' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600">Manage coupons, automatic discounts, and flash sales</p>
        </div>
        <button
          onClick={() => { setModal(activeTab === 'coupons' ? 'coupon' : activeTab === 'automatic' ? 'auto' : 'flash'); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'coupons' ? 'New Coupon' : activeTab === 'automatic' ? 'New Automatic Discount' : 'New Flash Sale'}
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id ? 'bg-gold-50 text-gold-700 border-b-2 border-gold-500' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'coupons' && (
            <motion.div key="coupons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Code</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Value</th>
                    <th className="px-6 py-4 font-medium">Min order</th>
                    <th className="px-6 py-4 font-medium">Usage</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Valid</th>
                    <th className="px-6 py-4 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{c.code}</span>
                          <button onClick={() => copyCode(c.code)} className="p-1 hover:bg-gray-200 rounded" title="Copy">
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm">{typeLabels[c.type] || c.type}</td>
                      <td className="px-6 py-4 text-sm">
                        {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? formatCurrency(c.value) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">{c.minOrderAmount != null ? formatCurrency(c.minOrderAmount) : '—'}</td>
                      <td className="px-6 py-4 text-sm">{c.usedCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ''}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          c.status === 'active' ? 'bg-green-100 text-green-700' :
                          c.status === 'expired' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {statusLabels[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {c.startsAt || c.endsAt ? (
                          <>{(c.startsAt ? new Date(c.startsAt).toLocaleDateString() : '—')} – {(c.endsAt ? new Date(c.endsAt).toLocaleDateString() : '—')}</>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingId(c.id); setModal('coupon'); }} className="p-2 hover:bg-gray-200 rounded" title="Edit">
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {coupons.length === 0 && (
                <div className="text-center py-12 text-gray-500">No coupons yet. Create one to get started.</div>
              )}
            </motion.div>
          )}

          {activeTab === 'automatic' && (
            <motion.div key="auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Value</th>
                    <th className="px-6 py-4 font-medium">Min order</th>
                    <th className="px-6 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {autoDiscounts.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{d.name}</td>
                      <td className="px-6 py-4 text-sm">{typeLabels[d.type] || d.type}</td>
                      <td className="px-6 py-4 text-sm">{d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}</td>
                      <td className="px-6 py-4 text-sm">{d.minOrderAmount != null ? formatCurrency(d.minOrderAmount) : '—'}</td>
                      <td className="px-6 py-4 text-sm">{d.priority}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingId(d.id); setModal('auto'); }} className="p-2 hover:bg-gray-200 rounded"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                          <button onClick={() => handleDeleteAuto(d.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {autoDiscounts.length === 0 && (
                <div className="text-center py-12 text-gray-500">No automatic discounts. Create one to apply automatically at checkout.</div>
              )}
            </motion.div>
          )}

          {activeTab === 'flash' && (
            <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Discount</th>
                    <th className="px-6 py-4 font-medium">Products</th>
                    <th className="px-6 py-4 font-medium">Period</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flashSales.map((f) => (
                    <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{f.name}</td>
                      <td className="px-6 py-4 text-sm">{f.discountType === 'percentage' ? `${f.discountValue}%` : formatCurrency(f.discountValue)}</td>
                      <td className="px-6 py-4 text-sm">{f.productIds?.length ?? 0} products</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(f.startsAt).toLocaleString()} – {new Date(f.endsAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${f.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {f.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingId(f.id); setModal('flash'); }} className="p-2 hover:bg-gray-200 rounded"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                          <button onClick={() => handleDeleteFlash(f.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {flashSales.length === 0 && (
                <div className="text-center py-12 text-gray-500">No flash sales. Create a time-limited sale for selected products.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Create/Edit Coupon modal */}
      <AnimatePresence>
        {modal === 'coupon' && (
          <CouponModal
            onClose={() => { setModal(null); setEditingId(null); }}
            onSaved={() => { loadCoupons(); setModal(null); setEditingId(null); toast.success('Coupon saved'); }}
            editingCoupon={editingId ? coupons.find((c) => c.id === editingId) ?? undefined : undefined}
          />
        )}
        {modal === 'auto' && (
          <AutoDiscountModal
            onClose={() => { setModal(null); setEditingId(null); }}
            onSaved={() => { loadAuto(); setModal(null); setEditingId(null); toast.success('Automatic discount saved'); }}
            editingDiscount={editingId ? autoDiscounts.find((d) => d.id === editingId) ?? undefined : undefined}
          />
        )}
        {modal === 'flash' && (
          <FlashSaleModal
            onClose={() => { setModal(null); setEditingId(null); }}
            onSaved={() => { loadFlash(); setModal(null); setEditingId(null); toast.success('Flash sale saved'); }}
            editingSale={editingId ? flashSales.find((f) => f.id === editingId) ?? undefined : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CouponModal({
  onClose,
  onSaved,
  editingCoupon,
}: {
  onClose: () => void;
  onSaved: () => void;
  editingCoupon?: CouponRow;
}) {
  const [code, setCode] = useState(editingCoupon?.code ?? '');
  const [description, setDescription] = useState(editingCoupon?.description ?? '');
  const [type, setType] = useState(editingCoupon?.type ?? 'percentage');
  const [value, setValue] = useState(editingCoupon?.value ?? 10);
  const [minOrderAmount, setMinOrderAmount] = useState(editingCoupon?.minOrderAmount ?? 10000);
  const [status, setStatus] = useState(editingCoupon?.status ?? 'active');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        code: code.toUpperCase().trim(),
        description: description || undefined,
        type,
        value: Number(value),
        minOrderAmount: Number(minOrderAmount) || undefined,
        usageLimitPerUser: 1,
        scope: 'entire_order',
        countries: ['IN', 'AE', 'UK'],
        status,
      };
      if (editingCoupon) {
        await api.patch(`/api/promotions/coupons/${editingCoupon.id}`, body);
      } else {
        await api.post('/api/promotions/coupons', body);
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to save';
      alert(msg);
    } finally {
      setSaving(false);
    }
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
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="GOLD10"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              disabled={!!editingCoupon}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="number"
                min={0}
                step={type === 'percentage' ? 1 : 100}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min order amount (₹)</label>
            <input
              type="number"
              min={0}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
          {editingCoupon && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function AutoDiscountModal({
  onClose,
  onSaved,
  editingDiscount,
}: {
  onClose: () => void;
  onSaved: () => void;
  editingDiscount?: AutoDiscountRow;
}) {
  const [name, setName] = useState(editingDiscount?.name ?? '');
  const [type, setType] = useState(editingDiscount?.type ?? 'percentage');
  const [value, setValue] = useState(editingDiscount?.value ?? 10);
  const [minOrderAmount, setMinOrderAmount] = useState(editingDiscount?.minOrderAmount ?? 10000);
  const [priority, setPriority] = useState(editingDiscount?.priority ?? 1);
  const [isActive, setIsActive] = useState(editingDiscount?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(editingDiscount?.startsAt ?? '');
  const [endsAt, setEndsAt] = useState(editingDiscount?.endsAt ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        type,
        value: Number(value),
        minOrderAmount: Number(minOrderAmount) || undefined,
        priority: Number(priority),
        isActive,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        countries: ['IN', 'AE', 'UK'],
      };
      if (editingDiscount) {
        await api.patch(`/api/promotions/automatic/${editingDiscount.id}`, body);
      } else {
        await api.post('/api/promotions/automatic', body);
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to save';
      alert(msg);
    } finally {
      setSaving(false);
    }
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
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{editingDiscount ? 'Edit Automatic Discount' : 'New Automatic Discount'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. First Order 10% Off"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="number"
                min={0}
                step={type === 'percentage' ? 1 : 100}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min order (₹)</label>
              <input
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                type="number"
                min={1}
                max={100}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
              <p className="text-xs text-gray-500 mt-1">Higher = applied first</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts at</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ends at</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
            />
            <label htmlFor="autoActive" className="text-sm text-gray-700">Active (apply automatically)</label>
          </div>
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function FlashSaleModal({
  onClose,
  onSaved,
  editingSale,
}: {
  onClose: () => void;
  onSaved: () => void;
  editingSale?: FlashSaleRow;
}) {
  const [name, setName] = useState(editingSale?.name ?? '');
  const [description, setDescription] = useState(editingSale?.description ?? '');
  const [discountType, setDiscountType] = useState(editingSale?.discountType ?? 'percentage');
  const [discountValue, setDiscountValue] = useState(editingSale?.discountValue ?? 20);
  const [productIds, setProductIds] = useState(editingSale?.productIds?.join(', ') ?? '');
  const [startsAt, setStartsAt] = useState(editingSale?.startsAt ? new Date(editingSale.startsAt).toISOString().slice(0, 16) : '');
  const [endsAt, setEndsAt] = useState(editingSale?.endsAt ? new Date(editingSale.endsAt).toISOString().slice(0, 16) : '');
  const [isActive, setIsActive] = useState(editingSale?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startsAt || !endsAt) {
      alert('Please set start and end times for the flash sale');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue: Number(discountValue),
        productIds: productIds.split(/[\s,]+/).map(id => id.trim()).filter(Boolean),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive,
        countries: ['IN', 'AE', 'UK'],
      };
      if (editingSale) {
        await api.patch(`/api/promotions/flash-sales/${editingSale.id}`, body);
      } else {
        await api.post('/api/promotions/flash-sales', body);
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to save';
      alert(msg);
    } finally {
      setSaving(false);
    }
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
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{editingSale ? 'Edit Flash Sale' : 'New Flash Sale'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Gold Rush"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for customers"
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input
                type="number"
                min={0}
                step={discountType === 'percentage' ? 1 : 100}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product IDs</label>
            <input
              value={productIds}
              onChange={(e) => setProductIds(e.target.value)}
              placeholder="e.g. prod_abc123, prod_xyz789"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated. Find IDs in <a href="/admin/products" target="_blank" className="text-gold-600 hover:underline">Products</a> page.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts at *</label>
              <input
                required
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ends at *</label>
              <input
                required
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="flashActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
            />
            <label htmlFor="flashActive" className="text-sm text-gray-700">Active (visible to customers)</label>
          </div>
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
