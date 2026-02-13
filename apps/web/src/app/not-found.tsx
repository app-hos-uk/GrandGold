import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="w-24 h-24 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-display font-bold text-gold-600">404</span>
        </div>
        <h1 className="text-2xl font-display font-semibold text-gray-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/in"
            className="inline-flex items-center justify-center px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/in/collections"
            className="inline-flex items-center justify-center px-6 py-3 border border-gold-500 text-gold-600 font-medium rounded-lg hover:bg-gold-50 transition-colors"
          >
            Browse Collections
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-8">
          Need help?{' '}
          <a href="mailto:Info@thegrandgold.com" className="text-gold-600 hover:text-gold-700">
            Contact us
          </a>
        </p>
      </div>
    </main>
  );
}
