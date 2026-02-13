'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-semibold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
          <a
            href="/in"
            className="inline-flex items-center justify-center px-6 py-3 border border-gold-500 text-gold-600 font-medium rounded-lg hover:bg-gold-50 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
        <p className="text-sm text-gray-400 mt-8">
          If the problem persists, please contact us at{' '}
          <a href="mailto:Info@thegrandgold.com" className="text-gold-600 hover:text-gold-700">
            Info@thegrandgold.com
          </a>
        </p>
      </div>
    </main>
  );
}
