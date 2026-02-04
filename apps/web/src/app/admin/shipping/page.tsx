'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Plus,
  Edit2,
  Check,
  X,
  Loader2,
  Package,
  Globe,
  Clock,
  DollarSign,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';
import { formatCurrency } from '@/lib/format';

interface Carrier {
  id: string;
  name: string;
  code: string;
  countries: string[];
  services: { name: string; estimatedDays: string; rateType: 'flat' | 'per_kg'; rate: number }[];
  isActive: boolean;
  supportsTracking: boolean;
  supportsInsurance: boolean;
}

const MOCK_CARRIERS: Carrier[] = [
  {
    id: '1',
    name: 'Delhivery',
    code: 'delhivery',
    countries: ['IN'],
    services: [
      { name: 'Standard', estimatedDays: '5-7', rateType: 'flat', rate: 80 },
      { name: 'Express', estimatedDays: '2-3', rateType: 'flat', rate: 150 },
    ],
    isActive: true,
    supportsTracking: true,
    supportsInsurance: true,
  },
  {
    id: '2',
    name: 'Blue Dart',
    code: 'bluedart',
    countries: ['IN'],
    services: [
      { name: 'Surface', estimatedDays: '4-6', rateType: 'per_kg', rate: 60 },
      { name: 'Air', estimatedDays: '2-3', rateType: 'per_kg', rate: 120 },
    ],
    isActive: true,
    supportsTracking: true,
    supportsInsurance: true,
  },
  {
    id: '3',
    name: 'DHL Express',
    code: 'dhl',
    countries: ['IN', 'AE', 'UK'],
    services: [
      { name: 'International', estimatedDays: '3-5', rateType: 'per_kg', rate: 500 },
    ],
    isActive: true,
    supportsTracking: true,
    supportsInsurance: true,
  },
  {
    id: '4',
    name: 'Aramex',
    code: 'aramex',
    countries: ['AE', 'UK'],
    services: [
      { name: 'Standard', estimatedDays: '4-6', rateType: 'flat', rate: 25 },
      { name: 'Express', estimatedDays: '1-2', rateType: 'flat', rate: 45 },
    ],
    isActive: true,
    supportsTracking: true,
    supportsInsurance: true,
  },
];

export default function AdminShippingPage() {
  const toast = useToast();
  const [carriers, setCarriers] = useState<Carrier[]>(MOCK_CARRIERS);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(25000);
  const [armoredTransportEnabled, setArmoredTransportEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('Shipping settings saved');
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Shipping' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping & Logistics</h1>
          <p className="text-gray-600">Carriers, rates, and delivery settings</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save settings
        </button>
      </div>

      {/* Global settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Global settings</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Free shipping threshold (₹)</label>
            <input
              type="number"
              min={0}
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
            <p className="text-xs text-gray-500 mt-1">Orders above this amount get free standard shipping</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="armored"
              checked={armoredTransportEnabled}
              onChange={(e) => setArmoredTransportEnabled(e.target.checked)}
              className="rounded text-gold-500 focus:ring-gold-500"
            />
            <label htmlFor="armored" className="text-sm font-medium text-gray-700">
              Enable armored transport for high-value orders (e.g. &gt; ₹5L)
            </label>
          </div>
        </div>
      </div>

      {/* Carriers */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Carriers</h2>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Plus className="w-4 h-4" />
            Add carrier
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {carriers.map((carrier) => (
            <div key={carrier.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{carrier.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{carrier.code}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${carrier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {carrier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        {carrier.countries.join(', ')}
                      </span>
                      {carrier.supportsTracking && <span>Tracking</span>}
                      {carrier.supportsInsurance && <span>Insurance</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {carrier.services.map((svc, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                          <span className="font-medium text-gray-700">{svc.name}</span>
                          <span className="text-gray-500">{svc.estimatedDays} days</span>
                          <span className="text-gold-600 font-medium">
                            {svc.rateType === 'flat' ? formatCurrency(svc.rate) : `${formatCurrency(svc.rate)}/kg`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-200 rounded-lg" title="Edit">
                  <Edit2 className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
        <strong>Integration:</strong> Connect real carrier APIs (Delhivery, Blue Dart, DHL, Aramex) for live rates and label generation. Return labels can be generated from the Returns workflow.
      </div>
    </div>
  );
}
