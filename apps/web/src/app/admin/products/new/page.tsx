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
  const [images, setImages] = useState<{ file?: File; url: string; type: 'main' | 'gallery' | '360' }[]>([]);
  const [imageUrl, setImageUrl] = useState('');
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
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Path</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-mono text-sm"
              placeholder="url-friendly-name"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated from name. Used in product URL: /product/[url-path]</p>
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

          {/* Product Images */}
          <div className="border-t pt-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Product Images</h2>
            <p className="text-xs text-gray-500 mb-3">Add up to 4 gallery images and optionally a 360° view image</p>
            
            {/* Current Images */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <span className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      img.type === 'main' ? 'bg-gold-500 text-white' : 
                      img.type === '360' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-white'
                    }`}>
                      {img.type === 'main' ? 'Main' : img.type === '360' ? '360°' : `${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image by URL */}
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL (https://...)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
              />
              <select
                id="imageType"
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                defaultValue="gallery"
              >
                <option value="main">Main Image</option>
                <option value="gallery">Gallery</option>
                <option value="360">360° View</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!imageUrl.trim()) return;
                  const select = document.getElementById('imageType') as HTMLSelectElement;
                  const type = select.value as 'main' | 'gallery' | '360';
                  // If adding main, remove existing main
                  if (type === 'main') {
                    setImages((prev) => [...prev.filter(i => i.type !== 'main'), { url: imageUrl.trim(), type: 'main' }]);
                  } else if (type === '360') {
                    // Only one 360 image
                    setImages((prev) => [...prev.filter(i => i.type !== '360'), { url: imageUrl.trim(), type: '360' }]);
                  } else {
                    // Max 4 gallery images
                    const galleryCount = images.filter(i => i.type === 'gallery').length;
                    if (galleryCount >= 4) {
                      alert('Maximum 4 gallery images allowed');
                      return;
                    }
                    setImages((prev) => [...prev, { url: imageUrl.trim(), type: 'gallery' }]);
                  }
                  setImageUrl('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Add
              </button>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Drag & drop images here, or click to browse</p>
              <p className="text-xs text-gray-400 mb-2">Supports: JPG, PNG, WebP (max 5MB each)</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const galleryCount = images.filter(i => i.type === 'gallery').length;
                  const remaining = 4 - galleryCount;
                  if (files.length > remaining) {
                    alert(`You can only add ${remaining} more gallery image(s)`);
                  }
                  files.slice(0, remaining).forEach((file) => {
                    const url = URL.createObjectURL(file);
                    setImages((prev) => [...prev, { file, url, type: 'gallery' }]);
                  });
                  e.target.value = '';
                }}
                className="hidden"
                id="imageUpload"
              />
              <label
                htmlFor="imageUpload"
                className="inline-block px-4 py-2 bg-gold-50 text-gold-700 rounded-lg cursor-pointer hover:bg-gold-100 text-sm font-medium"
              >
                Browse Files
              </label>
            </div>

            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p><strong>Main Image:</strong> Primary display image (1 max)</p>
              <p><strong>Gallery:</strong> Additional product views (up to 4)</p>
              <p><strong>360° View:</strong> Interactive 360-degree rotation image (1 max)</p>
            </div>
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
