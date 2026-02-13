'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Upload, X, Plus, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { adminApi, ApiError } from '@/lib/api';

// ── Constants ──────────────────────────────────────────────────────────────────

const FALLBACK_CATEGORIES = [
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'rings', label: 'Rings' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'bangles', label: 'Bangles' },
  { value: 'pendants', label: 'Pendants' },
  { value: 'mens_jewelry', label: "Men's Jewelry" },
  { value: 'gold_bars', label: 'Gold Bars' },
  { value: 'gold_coins', label: 'Gold Coins' },
  { value: 'chains', label: 'Chains' },
  { value: 'anklets', label: 'Anklets' },
  { value: 'nose_pins', label: 'Nose Pins' },
  { value: 'mangalsutra', label: 'Mangalsutra' },
  { value: 'sets', label: 'Jewelry Sets' },
];

const METAL_TYPES = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'palladium', label: 'Palladium' },
  { value: 'white_gold', label: 'White Gold' },
  { value: 'rose_gold', label: 'Rose Gold' },
];

const PURITY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  gold: [
    { value: '24K', label: '24K (99.9%)' },
    { value: '22K', label: '22K (91.6%)' },
    { value: '21K', label: '21K (87.5%)' },
    { value: '18K', label: '18K (75.0%)' },
    { value: '14K', label: '14K (58.3%)' },
    { value: '10K', label: '10K (41.7%)' },
  ],
  silver: [
    { value: '999', label: '999 (Fine Silver)' },
    { value: '925', label: '925 (Sterling)' },
    { value: '900', label: '900 (Coin Silver)' },
  ],
  platinum: [
    { value: '950', label: '950 (95%)' },
    { value: '900', label: '900 (90%)' },
    { value: '850', label: '850 (85%)' },
  ],
};
// White/rose gold share gold purities
PURITY_OPTIONS.white_gold = PURITY_OPTIONS.gold;
PURITY_OPTIONS.rose_gold = PURITY_OPTIONS.gold;
PURITY_OPTIONS.palladium = PURITY_OPTIONS.platinum;

const STONE_TYPES = [
  'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Topaz', 'Amethyst',
  'Garnet', 'Opal', 'Turquoise', 'Tanzanite', 'Peridot', 'Aquamarine',
  'Zircon', 'Cubic Zirconia', 'Moissanite', 'Coral', 'Onyx', 'Jade', 'Other',
];

const DIAMOND_CUTS = ['Round Brilliant', 'Princess', 'Oval', 'Marquise', 'Pear', 'Cushion', 'Emerald', 'Asscher', 'Radiant', 'Heart', 'Baguette'];
const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];
const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

const MAKING_CHARGE_TYPES = [
  { value: 'per_gram', label: 'Per Gram (₹/g)' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'flat', label: 'Flat Fee' },
];

const OCCASIONS = ['Wedding', 'Engagement', 'Daily Wear', 'Festive', 'Party', 'Anniversary', 'Gift', 'Traditional', 'Office Wear'];
const GENDERS = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'kids', label: 'Kids' },
];
const STYLES = ['Traditional', 'Modern', 'Contemporary', 'Fusion', 'Minimalist', 'Antique', 'Temple', 'Kundan', 'Meenakari', 'Polki'];

const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
  { value: 'UK', label: 'United Kingdom' },
];

const CURRENCY_MAP: Record<string, string> = { IN: 'INR', AE: 'AED', UK: 'GBP' };

// ── Stone row type ────────────────────────────────────────────────────────────
interface StoneRow {
  type: string;
  cut: string;
  clarity: string;
  color: string;
  caratWeight: string;
  count: string;
  ratePerCarat: string;
  certification: string;
  certificationNumber: string;
}

const emptyStone = (): StoneRow => ({
  type: '', cut: '', clarity: '', color: '', caratWeight: '', count: '1',
  ratePerCarat: '', certification: '', certificationNumber: '',
});

// ── Helper: collapsible section ───────────────────────────────────────────────
function Section({ title, subtitle, children, defaultOpen = true }: {
  title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-5">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}

// ── Input helper ──────────────────────────────────────────────────────────────
function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
      {hint && (
        <span className="ml-1 inline-flex items-center" title={hint}>
          <Info className="w-3.5 h-3.5 text-gray-400" />
        </span>
      )}
    </label>
  );
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm';
const selectCls = inputCls;

// ══════════════════════════════════════════════════════════════════════════════
// ██  MAIN COMPONENT                                                        ██
// ══════════════════════════════════════════════════════════════════════════════

export default function NewProductPage() {
  const router = useRouter();

  // ── Admin context ────────────────────────────────────────────────────────
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [adminCountry, setAdminCountry] = useState<string | null>(null);
  const isCountryAdmin = currentUserRole === 'country_admin';

  useEffect(() => {
    adminApi.getMe().then((user) => {
      setCurrentUserRole(user?.role || null);
      setAdminCountry(user?.country || null);
      if (user?.role === 'country_admin' && user?.country) {
        setForm((prev) => ({
          ...prev,
          countries: [user.country!],
          currency: CURRENCY_MAP[user.country!] || 'INR',
        }));
      }
    }).catch(() => { /* Layout handles auth */ });
  }, []);

  // ── Categories ───────────────────────────────────────────────────────────
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  useEffect(() => {
    adminApi.getCategories({ flat: true }).then((res) => {
      const data = Array.isArray(res) ? res : [];
      if (data.length > 0) {
        setCategories(data.map((c: { slug: string; name: string }) => ({ value: c.slug, label: c.name })));
      }
    }).catch(() => { /* Use fallback */ });
  }, []);

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Basic
    name: '',
    sku: '',
    slug: '',
    category: '',
    subcategory: '',
    description: '',
    // Pricing
    basePrice: '',
    currency: 'INR',
    pricingModel: 'fixed',
    // Metal
    metalType: 'gold',
    purity: '22K',
    goldWeight: '',       // net metal weight
    wastagePercent: '',
    // Making & charges
    makingCharges: '',
    makingChargeType: 'per_gram' as 'per_gram' | 'percentage' | 'flat',
    laborCost: '',
    wastageCharges: '',
    otherCharges: '',
    otherChargesNote: '',
    // Specifications
    grossWeight: '',
    netWeight: '',
    dimLength: '',
    dimWidth: '',
    dimHeight: '',
    dimUnit: 'mm',
    size: '',
    hallmarkNumber: '',
    certifications: '',
    // Metadata
    occasion: '',
    gender: '' as '' | 'men' | 'women' | 'unisex' | 'kids',
    style: '',
    // Inventory
    stockQuantity: '',
    tags: '',
    countries: ['IN'],
  });

  const [stones, setStones] = useState<StoneRow[]>([]);
  const [images, setImages] = useState<{ file?: File; url: string; type: 'main' | 'gallery' | '360' }[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleChange = useCallback((field: string, value: string | string[]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name') {
        next.slug = (value as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      // Sync netWeight ↔ goldWeight
      if (field === 'goldWeight') next.netWeight = value as string;
      if (field === 'netWeight') next.goldWeight = value as string;
      return next;
    });
  }, []);

  const handleCountryToggle = useCallback((country: string) => {
    if (isCountryAdmin) return;
    setForm((prev) => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter((c) => c !== country)
        : [...prev.countries, country],
    }));
  }, [isCountryAdmin]);

  // Available purities depend on selected metal type
  const purities = useMemo(() => {
    const base = form.metalType.replace('white_', '').replace('rose_', '');
    return PURITY_OPTIONS[form.metalType] || PURITY_OPTIONS[base] || PURITY_OPTIONS.gold;
  }, [form.metalType]);

  // ── Price breakdown calculation ──────────────────────────────────────────
  const priceBreakdown = useMemo(() => {
    const metalWeight = parseFloat(form.goldWeight) || 0;
    const mc = parseFloat(form.makingCharges) || 0;
    const lc = parseFloat(form.laborCost) || 0;
    const wc = parseFloat(form.wastageCharges) || 0;
    const oc = parseFloat(form.otherCharges) || 0;
    const base = parseFloat(form.basePrice) || 0;

    let makingTotal = 0;
    if (form.makingChargeType === 'per_gram') makingTotal = mc * metalWeight;
    else if (form.makingChargeType === 'percentage') makingTotal = (mc / 100) * base;
    else makingTotal = mc;

    const totalStoneValue = stones.reduce((sum, s) => {
      const ct = parseFloat(s.caratWeight) || 0;
      const cnt = parseInt(s.count) || 0;
      const rate = parseFloat(s.ratePerCarat) || 0;
      return sum + (ct * cnt * rate);
    }, 0);

    const subtotal = base + makingTotal + lc + wc + totalStoneValue + oc;

    return { metalWeight, makingTotal, laborCost: lc, wastageCharges: wc, totalStoneValue, otherCharges: oc, basePrice: base, subtotal };
  }, [form.goldWeight, form.makingCharges, form.makingChargeType, form.laborCost, form.wastageCharges, form.otherCharges, form.basePrice, stones]);

  // ── Stone handlers ───────────────────────────────────────────────────────
  const addStone = () => setStones((prev) => [...prev, emptyStone()]);
  const removeStone = (idx: number) => setStones((prev) => prev.filter((_, i) => i !== idx));
  const updateStone = (idx: number, field: keyof StoneRow, value: string) => {
    setStones((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (!form.category) { setError('Category is required'); return; }
    if (!form.basePrice || isNaN(Number(form.basePrice))) { setError('Valid base price is required'); return; }
    if (form.countries.length === 0) { setError('At least one country must be selected'); return; }

    setSubmitting(true);
    try {
      const productCountries = isCountryAdmin && adminCountry ? [adminCountry] : form.countries;

      // Build stones array
      const stonesPayload = stones
        .filter((s) => s.type)
        .map((s) => ({
          type: s.type,
          cut: s.cut || undefined,
          clarity: s.clarity || undefined,
          color: s.color || undefined,
          caratWeight: parseFloat(s.caratWeight) || undefined,
          count: parseInt(s.count) || 1,
          ratePerCarat: parseFloat(s.ratePerCarat) || undefined,
          totalValue: (parseFloat(s.caratWeight) || 0) * (parseInt(s.count) || 1) * (parseFloat(s.ratePerCarat) || 0) || undefined,
          certification: s.certification || undefined,
          certificationNumber: s.certificationNumber || undefined,
        }));

      // Build specifications
      const specifications: Record<string, unknown> = {};
      if (form.grossWeight) specifications.grossWeight = Number(form.grossWeight);
      if (form.netWeight) specifications.netWeight = Number(form.netWeight);
      if (form.dimLength || form.dimWidth || form.dimHeight) {
        specifications.dimensions = {
          length: parseFloat(form.dimLength) || undefined,
          width: parseFloat(form.dimWidth) || undefined,
          height: parseFloat(form.dimHeight) || undefined,
          unit: form.dimUnit,
        };
      }
      if (form.size) specifications.size = form.size;
      if (form.hallmarkNumber) specifications.hallmarkNumber = form.hallmarkNumber;
      if (form.certifications) specifications.certifications = form.certifications.split(',').map((c) => c.trim()).filter(Boolean);

      await adminApi.createProduct({
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        slug: form.slug.trim(),
        category: form.category,
        description: form.description.trim(),
        // Pricing
        basePrice: Number(form.basePrice),
        currency: form.currency,
        pricingModel: form.pricingModel as 'fixed' | 'live_rate',
        // Metal
        metalType: form.metalType,
        purity: form.purity,
        goldWeight: form.goldWeight ? Number(form.goldWeight) : undefined,
        wastagePercent: form.wastagePercent ? Number(form.wastagePercent) : undefined,
        // Charges
        makingCharges: form.makingCharges ? Number(form.makingCharges) : undefined,
        makingChargeType: form.makingChargeType,
        laborCost: form.laborCost ? Number(form.laborCost) : undefined,
        wastageCharges: form.wastageCharges ? Number(form.wastageCharges) : undefined,
        otherCharges: form.otherCharges ? Number(form.otherCharges) : undefined,
        otherChargesNote: form.otherChargesNote || undefined,
        // Stones & specs
        stones: stonesPayload.length > 0 ? stonesPayload : undefined,
        specifications: Object.keys(specifications).length > 0 ? specifications as Parameters<typeof adminApi.createProduct>[0]['specifications'] : undefined,
        // Metadata
        occasion: form.occasion || undefined,
        gender: form.gender || undefined,
        style: form.style || undefined,
        // Inventory
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        countries: productCountries,
      });
      setSuccess(true);
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Products', href: '/admin/products' }, { label: 'New Product' }]} />
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Create New Product</h1>
        <p className="text-gray-500 text-sm mb-6">Add a new jewelry product with complete metal, stone, and pricing details.</p>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" /> Product created successfully! Redirecting...
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-1">

          {/* ─── SECTION 1: Basic Info ──────────────────────────────────────── */}
          <Section title="Basic Information" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Product Name" required />
                <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputCls} placeholder="e.g., 22K Gold Kundan Necklace" />
              </div>
              <div>
                <FieldLabel label="SKU" hint="Leave blank to auto-generate" />
                <input type="text" value={form.sku} onChange={(e) => handleChange('sku', e.target.value)} className={inputCls} placeholder="Auto-generated if empty" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <FieldLabel label="Category" required />
                <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={selectCls}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel label="Subcategory" />
                <input type="text" value={form.subcategory} onChange={(e) => handleChange('subcategory', e.target.value)} className={inputCls} placeholder="e.g., Bridal Set" />
              </div>
            </div>
            <div className="mt-4">
              <FieldLabel label="URL Slug" />
              <input type="text" value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} className={`${inputCls} font-mono`} placeholder="auto-generated-from-name" />
            </div>
            <div className="mt-4">
              <FieldLabel label="Description" />
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className={inputCls} placeholder="Detailed product description..." />
            </div>
            {/* Metadata row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <FieldLabel label="Occasion" />
                <select value={form.occasion} onChange={(e) => handleChange('occasion', e.target.value)} className={selectCls}>
                  <option value="">Select occasion</option>
                  {OCCASIONS.map((o) => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel label="Gender" />
                <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className={selectCls}>
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel label="Style" />
                <select value={form.style} onChange={(e) => handleChange('style', e.target.value)} className={selectCls}>
                  <option value="">Select style</option>
                  {STYLES.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {/* ─── SECTION 2: Metal Details ──────────────────────────────────── */}
          <Section title="Metal Details" subtitle="Primary metal used in this piece">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel label="Metal Type" required />
                <select value={form.metalType} onChange={(e) => { handleChange('metalType', e.target.value); }} className={selectCls}>
                  {METAL_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel label="Purity / Fineness" required />
                <select value={form.purity} onChange={(e) => handleChange('purity', e.target.value)} className={selectCls}>
                  {purities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel label="Net Metal Weight (g)" required hint="Weight of metal only, excluding stones" />
                <input type="number" step="0.001" min="0" value={form.goldWeight} onChange={(e) => handleChange('goldWeight', e.target.value)} className={inputCls} placeholder="0.000" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <FieldLabel label="Wastage %" hint="Metal lost during manufacturing (typically 2-8%)" />
                <input type="number" step="0.1" min="0" max="100" value={form.wastagePercent} onChange={(e) => handleChange('wastagePercent', e.target.value)} className={inputCls} placeholder="e.g., 3" />
              </div>
              <div>
                <FieldLabel label="Gross Weight (g)" hint="Total piece weight including stones" />
                <input type="number" step="0.001" min="0" value={form.grossWeight} onChange={(e) => handleChange('grossWeight', e.target.value)} className={inputCls} placeholder="0.000" />
              </div>
            </div>
          </Section>

          {/* ─── SECTION 3: Stone Details ──────────────────────────────────── */}
          <Section title="Stone Details" subtitle="Add each stone type used in this piece" defaultOpen={stones.length > 0}>
            {stones.length === 0 && (
              <p className="text-sm text-gray-500 mb-3">No stones added. Click below to add stone details.</p>
            )}
            {stones.map((stone, idx) => (
              <div key={idx} className="relative bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                <button type="button" onClick={() => removeStone(idx)} className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
                <p className="text-xs font-semibold text-gray-600 mb-3">Stone #{idx + 1}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <FieldLabel label="Stone Type" required />
                    <select value={stone.type} onChange={(e) => updateStone(idx, 'type', e.target.value)} className={selectCls}>
                      <option value="">Select</option>
                      {STONE_TYPES.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Cut" />
                    <select value={stone.cut} onChange={(e) => updateStone(idx, 'cut', e.target.value)} className={selectCls}>
                      <option value="">Select</option>
                      {DIAMOND_CUTS.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Clarity" />
                    <select value={stone.clarity} onChange={(e) => updateStone(idx, 'clarity', e.target.value)} className={selectCls}>
                      <option value="">Select</option>
                      {DIAMOND_CLARITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Color" />
                    <select value={stone.color} onChange={(e) => updateStone(idx, 'color', e.target.value)} className={selectCls}>
                      <option value="">Select</option>
                      {DIAMOND_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="fancy">Fancy Color</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div>
                    <FieldLabel label="Carat Weight" hint="Weight per stone" />
                    <input type="number" step="0.01" min="0" value={stone.caratWeight} onChange={(e) => updateStone(idx, 'caratWeight', e.target.value)} className={inputCls} placeholder="0.00" />
                  </div>
                  <div>
                    <FieldLabel label="No. of Pieces" required />
                    <input type="number" min="1" value={stone.count} onChange={(e) => updateStone(idx, 'count', e.target.value)} className={inputCls} placeholder="1" />
                  </div>
                  <div>
                    <FieldLabel label="Rate / Carat" hint="Price per carat" />
                    <input type="number" step="0.01" min="0" value={stone.ratePerCarat} onChange={(e) => updateStone(idx, 'ratePerCarat', e.target.value)} className={inputCls} placeholder="0" />
                  </div>
                  <div>
                    <FieldLabel label="Total Value" />
                    <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                      {((parseFloat(stone.caratWeight) || 0) * (parseInt(stone.count) || 1) * (parseFloat(stone.ratePerCarat) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <FieldLabel label="Certification" hint="GIA, IGI, HRD, etc." />
                    <input type="text" value={stone.certification} onChange={(e) => updateStone(idx, 'certification', e.target.value)} className={inputCls} placeholder="e.g., GIA" />
                  </div>
                  <div>
                    <FieldLabel label="Certificate No." />
                    <input type="text" value={stone.certificationNumber} onChange={(e) => updateStone(idx, 'certificationNumber', e.target.value)} className={inputCls} placeholder="e.g., 2176543210" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addStone} className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gold-500 hover:text-gold-700 text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add Stone
            </button>
          </Section>

          {/* ─── SECTION 4: Pricing & Charges ─────────────────────────────── */}
          <Section title="Pricing & Charges" subtitle="Making charges (MC), labour, wastage, and final price">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel label="Pricing Model" required />
                <select value={form.pricingModel} onChange={(e) => handleChange('pricingModel', e.target.value)} className={selectCls}>
                  <option value="fixed">Fixed Price</option>
                  <option value="live_rate">Live Metal Rate</option>
                </select>
              </div>
              <div>
                <FieldLabel label="Currency" />
                <select value={form.currency} onChange={(e) => handleChange('currency', e.target.value)} className={selectCls}>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <FieldLabel label="Base Metal Value" required hint="Metal weight x rate x purity (or fixed price)" />
                <input type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => handleChange('basePrice', e.target.value)} className={inputCls} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <FieldLabel label="Making Charge Type" />
                <select value={form.makingChargeType} onChange={(e) => handleChange('makingChargeType', e.target.value)} className={selectCls}>
                  {MAKING_CHARGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel label="Making Charges (MC)" hint={form.makingChargeType === 'per_gram' ? 'Amount per gram' : form.makingChargeType === 'percentage' ? 'Percentage of base price' : 'Flat fee'} />
                <input type="number" step="0.01" min="0" value={form.makingCharges} onChange={(e) => handleChange('makingCharges', e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <FieldLabel label="MC Total (calculated)" />
                <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                  {priceBreakdown.makingTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <FieldLabel label="Labour / Other Labour Cost" hint="Flat labour cost if separate from MC" />
                <input type="number" step="0.01" min="0" value={form.laborCost} onChange={(e) => handleChange('laborCost', e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <FieldLabel label="Wastage Charges" hint="Metal wastage cost (or use Wastage % above)" />
                <input type="number" step="0.01" min="0" value={form.wastageCharges} onChange={(e) => handleChange('wastageCharges', e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <FieldLabel label="Other Charges" hint="Hallmarking, packaging, certification, etc." />
                <input type="number" step="0.01" min="0" value={form.otherCharges} onChange={(e) => handleChange('otherCharges', e.target.value)} className={inputCls} placeholder="0" />
              </div>
            </div>
            {parseFloat(form.otherCharges) > 0 && (
              <div className="mt-3">
                <FieldLabel label="Other Charges Description" />
                <input type="text" value={form.otherChargesNote} onChange={(e) => handleChange('otherChargesNote', e.target.value)} className={inputCls} placeholder="e.g., Hallmarking ₹45 + Rhodium plating ₹200" />
              </div>
            )}

            {/* ── Price Summary ─────────────────────────────────────────────── */}
            <div className="mt-5 bg-gold-50 border border-gold-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gold-900 mb-3">Price Breakdown Summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Base Metal Value</span><span className="font-medium">{form.currency} {priceBreakdown.basePrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
                {priceBreakdown.makingTotal > 0 && <div className="flex justify-between"><span className="text-gray-600">Making Charges</span><span className="font-medium">+ {priceBreakdown.makingTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>}
                {priceBreakdown.laborCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Labour Cost</span><span className="font-medium">+ {priceBreakdown.laborCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>}
                {priceBreakdown.wastageCharges > 0 && <div className="flex justify-between"><span className="text-gray-600">Wastage Charges</span><span className="font-medium">+ {priceBreakdown.wastageCharges.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>}
                {priceBreakdown.totalStoneValue > 0 && <div className="flex justify-between"><span className="text-gray-600">Stone Value</span><span className="font-medium">+ {priceBreakdown.totalStoneValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>}
                {priceBreakdown.otherCharges > 0 && <div className="flex justify-between"><span className="text-gray-600">Other Charges</span><span className="font-medium">+ {priceBreakdown.otherCharges.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>}
                <div className="border-t border-gold-300 pt-2 flex justify-between text-base font-bold text-gold-900">
                  <span>Estimated Total</span>
                  <span>{form.currency} {priceBreakdown.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <p className="text-xs text-gold-700 mt-2">* GST/VAT will be applied at checkout based on country regulations.</p>
            </div>
          </Section>

          {/* ─── SECTION 5: Specifications & Hallmark ─────────────────────── */}
          <Section title="Specifications & Certification" subtitle="Dimensions, hallmark, and quality certifications" defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel label="Hallmark Number" hint="BIS Hallmark ID (India)" />
                <input type="text" value={form.hallmarkNumber} onChange={(e) => handleChange('hallmarkNumber', e.target.value)} className={inputCls} placeholder="e.g., XXXX-XXXX" />
              </div>
              <div>
                <FieldLabel label="Size" hint="Ring size, bangle diameter, chain length, etc." />
                <input type="text" value={form.size} onChange={(e) => handleChange('size', e.target.value)} className={inputCls} placeholder="e.g., 16 inch, Size 7" />
              </div>
              <div>
                <FieldLabel label="Certifications" hint="Comma-separated" />
                <input type="text" value={form.certifications} onChange={(e) => handleChange('certifications', e.target.value)} className={inputCls} placeholder="BIS, GIA, IGI" />
              </div>
            </div>
            <div className="mt-4">
              <FieldLabel label="Dimensions" />
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <input type="number" step="0.1" min="0" value={form.dimLength} onChange={(e) => handleChange('dimLength', e.target.value)} className={inputCls} placeholder="Length" />
                </div>
                <div>
                  <input type="number" step="0.1" min="0" value={form.dimWidth} onChange={(e) => handleChange('dimWidth', e.target.value)} className={inputCls} placeholder="Width" />
                </div>
                <div>
                  <input type="number" step="0.1" min="0" value={form.dimHeight} onChange={(e) => handleChange('dimHeight', e.target.value)} className={inputCls} placeholder="Height" />
                </div>
                <div>
                  <select value={form.dimUnit} onChange={(e) => handleChange('dimUnit', e.target.value)} className={selectCls}>
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="inch">inch</option>
                  </select>
                </div>
              </div>
            </div>
          </Section>

          {/* ─── SECTION 6: Product Images ─────────────────────────────────── */}
          <Section title="Product Images" subtitle="Main, gallery, and 360° images" defaultOpen={false}>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <span className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      img.type === 'main' ? 'bg-gold-500 text-white' : img.type === '360' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-white'
                    }`}>
                      {img.type === 'main' ? 'Main' : img.type === '360' ? '360°' : `${idx + 1}`}
                    </span>
                    <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mb-3">
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Enter image URL (https://...)" className={`flex-1 ${inputCls}`} />
              <select id="imageType" className={`w-28 ${selectCls}`} defaultValue="gallery">
                <option value="main">Main</option>
                <option value="gallery">Gallery</option>
                <option value="360">360°</option>
              </select>
              <button type="button" onClick={() => {
                if (!imageUrl.trim()) return;
                const select = document.getElementById('imageType') as HTMLSelectElement;
                const type = select.value as 'main' | 'gallery' | '360';
                if (type === 'main') setImages((prev) => [...prev.filter(i => i.type !== 'main'), { url: imageUrl.trim(), type: 'main' }]);
                else if (type === '360') setImages((prev) => [...prev.filter(i => i.type !== '360'), { url: imageUrl.trim(), type: '360' }]);
                else {
                  if (images.filter(i => i.type === 'gallery').length >= 6) { alert('Maximum 6 gallery images'); return; }
                  setImages((prev) => [...prev, { url: imageUrl.trim(), type: 'gallery' }]);
                }
                setImageUrl('');
              }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Add</button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Drag & drop images or click to browse</p>
              <p className="text-xs text-gray-400 mb-2">JPG, PNG, WebP (max 5MB each)</p>
              <input type="file" accept="image/*" multiple onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const galleryCount = images.filter(i => i.type === 'gallery').length;
                const remaining = 6 - galleryCount;
                files.slice(0, remaining).forEach((file) => {
                  const url = URL.createObjectURL(file);
                  setImages((prev) => [...prev, { file, url, type: 'gallery' }]);
                });
                e.target.value = '';
              }} className="hidden" id="imageUpload" />
              <label htmlFor="imageUpload" className="inline-block px-4 py-2 bg-gold-50 text-gold-700 rounded-lg cursor-pointer hover:bg-gold-100 text-sm font-medium">Browse Files</label>
            </div>
          </Section>

          {/* ─── SECTION 7: Inventory ──────────────────────────────────────── */}
          <Section title="Inventory & Tags" defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Stock Quantity" />
                <input type="number" min="0" value={form.stockQuantity} onChange={(e) => handleChange('stockQuantity', e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <FieldLabel label="Tags" hint="Comma-separated" />
                <input type="text" value={form.tags} onChange={(e) => handleChange('tags', e.target.value)} className={inputCls} placeholder="gold, necklace, bridal, 22k" />
              </div>
            </div>
          </Section>

          {/* ─── SECTION 8: Countries ──────────────────────────────────────── */}
          <Section title="Available Countries" defaultOpen={true}>
            <div className="flex flex-wrap gap-3">
              {COUNTRIES.map((c) => (
                <label key={c.value} className={`flex items-center gap-2 ${isCountryAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input type="checkbox" checked={form.countries.includes(c.value)} onChange={() => handleCountryToggle(c.value)} disabled={isCountryAdmin}
                    className="rounded text-gold-500 focus:ring-gold-500" />
                  <span className="text-sm text-gray-700">{c.label}</span>
                </label>
              ))}
            </div>
            {isCountryAdmin && <p className="text-xs text-gray-500 mt-2">Country is locked to your assigned country ({adminCountry}).</p>}
          </Section>

          {/* ─── Actions ──────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <Link href="/admin/products" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</Link>
            <button type="submit" disabled={submitting || success}
              className="flex-1 px-5 py-2.5 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Creating Product...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
