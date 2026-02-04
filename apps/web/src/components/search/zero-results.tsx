'use client';

import Link from 'next/link';
import { Search, Sparkles, ChevronRight } from 'lucide-react';

export interface ZeroResultsProps {
  query?: string;
  country: string;
  suggestions?: string[];
  className?: string;
}

const DEFAULT_SUGGESTIONS = [
  'Try "22K gold necklace"',
  'Try "diamond earrings"',
  'Try "temple jewellery"',
  'Browse by category',
];

export function ZeroResults({ query, country, suggestions = DEFAULT_SUGGESTIONS, className = '' }: ZeroResultsProps) {
  return (
    <div className={`text-center py-16 px-4 ${className}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No results found</h2>
      {query ? (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          We couldn&apos;t find anything for &quot;{query}&quot;. Try different keywords or browse categories.
        </p>
      ) : (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          No products match your filters. Try adjusting filters or browse our collections.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {suggestions.map((s, i) => (
          <Link
            key={i}
            href={s.includes('category') ? `/${country}/collections` : `/${country}?q=${encodeURIComponent(s.replace(/^Try "/, '').replace(/"$/, ''))}`}
            className="inline-flex items-center gap-1 px-4 py-2 bg-cream-100 hover:bg-gold-100 text-gray-700 hover:text-gold-800 rounded-lg text-sm transition-colors"
          >
            {s}
            <ChevronRight className="w-4 h-4" />
          </Link>
        ))}
      </div>
      <Link
        href={`/${country}/collections`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors font-medium"
      >
        <Sparkles className="w-5 h-5" />
        Browse collections
      </Link>
    </div>
  );
}
