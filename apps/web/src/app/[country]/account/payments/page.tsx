'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';

  return (
    <main className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4">
        <Link
          href={`/${country}/account`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gold-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Account
        </Link>
        <div className="bg-white rounded-2xl p-8 text-center">
          <CreditCard className="w-16 h-16 text-gold-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Methods</h1>
          <p className="text-gray-500 mb-6">Save your payment methods for faster checkout.</p>
          <p className="text-sm text-gray-400">Coming soon</p>
        </div>
      </div>
    </main>
  );
}
