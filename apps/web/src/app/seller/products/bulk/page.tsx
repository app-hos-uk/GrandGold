'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  X,
  FileCheck,
} from 'lucide-react';
import { useToast } from '@/components/admin/toast';

const TEMPLATE_HEADERS = [
  'sku',
  'name',
  'slug',
  'category',
  'description',
  'base_price',
  'currency',
  'pricing_model',
  'gold_weight',
  'purity',
  'metal_type',
  'stock_quantity',
  'tags',
  'countries',
];

export default function SellerBulkUploadPage() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors?: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const downloadTemplate = () => {
    const csv = [TEMPLATE_HEADERS.join(','), ['GG-SKU-001', 'Sample Gold Necklace', 'sample-gold-necklace', 'necklaces', 'Description', '150000', 'INR', 'fixed', '10', '22K', 'gold', '5', 'gold,necklace', 'IN,AE,UK'].join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grandgold-product-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      setResult(null);
      return;
    }
    if (!f.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // In production: await api.postFormData('/api/sellers/products/bulk', formData);
      await new Promise((r) => setTimeout(r, 2000));
      setResult({ success: 48, failed: 2, errors: ['Row 12: Invalid category', 'Row 31: Duplicate SKU'] });
      toast.success('Upload complete. Review results below.');
    } catch {
      toast.error('Upload failed');
      setResult({ success: 0, failed: 50, errors: ['Upload service unavailable'] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/seller/products" className="inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 mb-4">
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h1>
        <p className="text-gray-600">Upload a CSV to add or update many products at once.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Download template</h2>
          <p className="text-sm text-gray-500 mb-4">
            Use our CSV template with the correct column headers. Fill in your products and save as CSV.
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            Download template
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Upload your file</h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="bulk-file"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <label htmlFor="bulk-file" className="cursor-pointer block">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-10 h-10 text-gold-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleFile(null); }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Drag and drop your CSV here, or click to browse</p>
                </>
              )}
            </label>
          </div>
          <button
            type="button"
            disabled={!file || uploading}
            onClick={handleUpload}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {uploading ? 'Uploading...' : 'Upload & import'}
          </button>
        </motion.div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import result</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">{result.success} succeeded</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">{result.failed} failed</span>
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
        <strong>Tips:</strong> Keep SKUs unique. Categories: necklaces, earrings, rings, bracelets, bangles, pendants, mens_jewelry, gold_bars, gold_coins. Purity: 24K, 22K, 21K, 18K, 14K, 10K. Countries: IN, AE, UK (comma-separated).
      </div>
    </div>
  );
}
