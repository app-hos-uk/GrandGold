'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Upload, X } from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { adminApi, ApiError } from '@/lib/api';

const CATEGORIES = [
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'rings', label: 'Rings' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'bangles', label: 'Bangles' },
  { value: 'pendants', label: 'Pendants' },
  { value: 'mens_jewelry', label: "Men's Jewelry" },
  { value: 'gold_bars', label: 'Gold Bars' },
  { value: 'gold_coins', label: 'Gold Coins' },
];

const PURITY_OPTIONS = ['24K', '22K', '21K', '18K', '14K', '10K'];
const METAL_TYPES = ['gold', 'silver', 'platinum', 'white_gold', 'rose_gold'];
const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
  { value: 'UK', label: 'United Kingdom' },
];

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    sku: '',
    slug: '',
    category: '',
    description: '',
    basePrice: '',
    currency: 'INR',
    pricingModel: 'fixed',
    goldWeight: '',
    purity: '22K',
    metalType: 'gold',
    stockQuantity: '',
    tags: '',
    countries: ['IN'],
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setForm((prev) => ({ ...prev, slug }));
    }
  };

  const handleCountryToggle = (country: string) => {
    setForm((prev) => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter((c) => c !== country)
        : [...prev.countries, country],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!form.category) {
      setError('Category is required');
      return;
    }
    if (!form.basePrice || isNaN(Number(form.basePrice))) {
      setError('Valid price is required');
      return;
    }
    if (form.countries.length === 0) {
      setError('At least one country must be selected');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createProduct({
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        slug: form.slug.trim(),
        category: form.category,
        description: form.description.trim(),
        basePrice: Number(form.basePrice),
        currency: form.currency,
        pricingModel: form.pricingModel as 'fixed' | 'live_rate',
        goldWeight: form.goldWeight ? Number(form.goldWeight) : undefined,
        purity: form.purity,
        metalType: form.metalType,
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        countries: form.countries,
      });
      setSuccess(true);
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Products', href: '/admin/products' }, { label: 'New Product' }]} />
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Create New Product</h1>
        <p className="text-gray-500 mb-6">Add a new product to the catalog.</p>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Product created successfully! Redirecting...
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="e.g., 22K Gold Necklace"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="url-friendly-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Product description..."
            />
          </div>

          {/* Pricing */}
          <div className="border-t pt-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => handleChange('basePrice', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="INR">INR</option>
                  <option value="AED">AED</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Model</label>
                <select
                  value={form.pricingModel}
                  onChange={(e) => handleChange('pricingModel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="live_rate">Live Gold Rate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="border-t pt-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gold Weight (grams)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.goldWeight}
                  onChange={(e) => handleChange('goldWeight', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
                <select
                  value={form.purity}
                  onChange={(e) => handleChange('purity', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {PURITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metal Type</label>
                <select
                  value={form.metalType}
                  onChange={(e) => handleChange('metalType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {METAL_TYPES.map((m) => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="border-t pt-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={form.stockQuantity}
                  onChange={(e) => handleChange('stockQuantity', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="gold, necklace, 22k (comma-separated)"
                />
              </div>
            </div>
          </div>

          {/* Countries */}
          <div className="border-t pt-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Available Countries <span className="text-red-500">*</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              {COUNTRIES.map((c) => (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.countries.includes(c.value)}
                    onChange={() => handleCountryToggle(c.value)}
                    className="rounded text-gold-500 focus:ring-gold-500"
                  />
                  <span className="text-sm text-gray-700">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Link
              href="/admin/products"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || success}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
