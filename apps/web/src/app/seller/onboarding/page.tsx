'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  FileText,
  CreditCard,
  FileSignature,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { onboardingApi } from '@/lib/api';

const steps = [
  { id: 1, title: 'Business Info', icon: Building2 },
  { id: 2, title: 'Documents', icon: FileText },
  { id: 3, title: 'Bank Details', icon: CreditCard },
  { id: 4, title: 'Agreement', icon: FileSignature },
];

export default function SellerOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<{
    status?: string;
    currentStep?: number;
    totalSteps?: number;
    completedSteps?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onboardingApi
      .getStatus()
      .then((data) => {
        setStatus(data);
        if (data?.currentStep) setCurrentStep(Math.min(data.currentStep + 1, 4));
      })
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gold-500" />
      </div>
    );
  }

  if (status?.status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Approved!</h1>
        <p className="text-gray-600 mb-8">Your seller account is ready. Start adding products.</p>
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
        >
          Go to Seller Dashboard
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  if (status?.status === 'in_review') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h1>
        <p className="text-gray-600 mb-8">Your application is being reviewed. We&apos;ll notify you within 24-48 hours.</p>
        <Link href="/seller" className="text-gold-600 hover:text-gold-700 font-medium">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <Link href="/seller" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          ← Back to Seller Hub
        </Link>
        <p className="text-sm text-gray-500 mb-4">You must be logged in to complete onboarding.</p>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-gold-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seller Onboarding</h1>
            <p className="text-gray-600">Complete these steps to start selling on GrandGold</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-12">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                currentStep >= step.id ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <step.icon className="w-5 h-5" />
              <span className="font-medium text-sm hidden sm:inline">{step.title}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${currentStep > step.id ? 'bg-gold-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <Step1BusinessInfo
            key="step1"
            onNext={() => setCurrentStep(2)}
            onError={setError}
          />
        )}
        {currentStep === 2 && (
          <Step2Documents
            key="step2"
            onNext={() => setCurrentStep(3)}
            onPrev={() => setCurrentStep(1)}
            onError={setError}
          />
        )}
        {currentStep === 3 && (
          <Step3BankDetails
            key="step3"
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
            onError={setError}
          />
        )}
        {currentStep === 4 && (
          <Step4Agreement
            key="step4"
            onPrev={() => setCurrentStep(3)}
            onError={setError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Step1BusinessInfo({
  onNext,
  onError,
}: {
  onNext: () => void;
  onError: (e: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'individual' as 'individual' | 'company' | 'partnership',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN' as 'IN' | 'AE' | 'UK',
    onboardingType: 'automated' as 'automated' | 'manual',
    acceptTerms: false,
    acceptCommissionStructure: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    try {
      await onboardingApi.start({
        ...form,
        businessAddress: {
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          state: form.state || undefined,
          postalCode: form.postalCode,
          country: form.country,
        },
        acceptTerms: true,
        acceptCommissionStructure: true,
      });
      onNext();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to start onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold mb-6">Business Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input
            required
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
          <select
            value={form.businessType}
            onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value as 'individual' | 'company' | 'partnership' }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            required
            value={form.line1}
            onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
            placeholder="Street address"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 mb-2"
          />
          <input
            value={form.line2}
            onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
            placeholder="Suite, unit, etc. (optional)"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 mb-2"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              required
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="City"
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <input
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              placeholder="State"
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <input
              required
              value={form.postalCode}
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              placeholder="Postal"
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value as 'IN' | 'AE' | 'UK' }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="IN">India</option>
            <option value="AE">UAE</option>
            <option value="UK">UK</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Type</label>
          <select
            value={form.onboardingType}
            onChange={(e) => setForm((f) => ({ ...f, onboardingType: e.target.value as 'automated' | 'manual' }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="automated">Automated (24-48 hrs)</option>
            <option value="manual">Manual (3-5 business days)</option>
          </select>
        </div>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            required
            checked={form.acceptTerms}
            onChange={(e) => setForm((f) => ({ ...f, acceptTerms: e.target.checked }))}
            className="mt-1"
          />
          <label className="text-sm text-gray-600">I accept the seller terms and commission structure</label>
        </div>
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function Step2Documents({
  onNext,
  onPrev,
  onError,
}: {
  onNext: () => void;
  onPrev: () => void;
  onError: (e: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ tradeLicense?: File; vatCertificate?: File; goldDealerPermit?: File }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.tradeLicense && !files.vatCertificate && !files.goldDealerPermit) {
      onError('Please upload at least one document');
      return;
    }
    setLoading(true);
    onError(null);
    try {
      const formData = new FormData();
      if (files.tradeLicense) formData.append('tradeLicense', files.tradeLicense);
      if (files.vatCertificate) formData.append('vatCertificate', files.vatCertificate);
      if (files.goldDealerPermit) formData.append('goldDealerPermit', files.goldDealerPermit);
      await onboardingApi.uploadDocuments(formData);
      onNext();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold mb-6">Upload Documents</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'tradeLicense', label: 'Trade License', desc: 'PDF, JPEG or PNG (max 10MB)' },
          { key: 'vatCertificate', label: 'VAT Certificate', desc: 'Optional' },
          { key: 'goldDealerPermit', label: 'Gold Dealer Permit', desc: 'Required for gold jewellery' },
        ].map(({ key, label, desc }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <p className="text-xs text-gray-500 mb-2">{desc}</p>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={(e) => setFiles((f) => ({ ...f, [key]: e.target.files?.[0] }))}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold-50 file:text-gold-700"
            />
          </div>
        ))}
        <div className="flex justify-between pt-4">
          <button type="button" onClick={onPrev} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function Step3BankDetails({
  onNext,
  onPrev,
  onError,
}: {
  onNext: () => void;
  onPrev: () => void;
  onError: (e: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    swiftCode: '',
    iban: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    try {
      await onboardingApi.submitBankDetails(form);
      onNext();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold mb-6">Bank Account Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
          <input
            required
            value={form.accountName}
            onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <input
            required
            value={form.bankName}
            onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <input
            required
            value={form.accountNumber}
            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code / IFSC</label>
            <input
              value={form.branchCode}
              onChange={(e) => setForm((f) => ({ ...f, branchCode: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT / IBAN (International)</label>
            <input
              value={form.swiftCode || form.iban}
              onChange={(e) => setForm((f) => ({ ...f, swiftCode: e.target.value, iban: e.target.value }))}
              placeholder="For UAE/UK"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
        </div>
        <div className="flex justify-between pt-4">
          <button type="button" onClick={onPrev} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function Step4Agreement({
  onPrev,
  onError,
}: {
  onPrev: () => void;
  onError: (e: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSign = async () => {
    setLoading(true);
    onError(null);
    try {
      const result = await onboardingApi.signAgreement();
      if (result?.signingUrl) window.location.href = result.signingUrl;
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to initiate signing');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    onError(null);
    try {
      await onboardingApi.submit();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold mb-6">Seller Agreement</h2>
      <div className="prose prose-sm max-w-none mb-6">
        <p className="text-gray-600">
          Please review and sign the GrandGold Seller Agreement. This covers commission structure, payment terms, and marketplace rules.
        </p>
      </div>
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={handleSign}
          disabled={loading}
          className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSignature className="w-5 h-5" />}
          Sign Agreement
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <button type="button" onClick={onPrev} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
