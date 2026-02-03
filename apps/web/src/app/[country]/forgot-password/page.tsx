'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';

  return (
    <main className="min-h-screen bg-cream-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-cream-200 p-8 text-center">
          <div className="w-14 h-14 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-gold-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Reset password</h1>
          <p className="text-gray-600 mt-2">
            Password reset is not yet configured. Please contact support at{' '}
            <a href="mailto:Info@thegrandgold.com" className="text-gold-600 hover:text-gold-700">
              Info@thegrandgold.com
            </a>{' '}
            for assistance.
          </p>
          <Link
            href={`/${country}/login`}
            className="mt-6 inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
