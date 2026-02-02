'use client';

import Link from 'next/link';
import { Sparkles, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface TrendingProductsProps {
  country: 'in' | 'ae' | 'uk';
  products: Product[];
}

export function TrendingProducts({ country, products }: TrendingProductsProps) {
  const currency = country === 'in' ? '₹' : country === 'ae' ? 'AED ' : '£';

  return (
    <section className="py-12">
      <h2 className="text-2xl font-semibold text-center mb-8 flex items-center justify-center gap-2">
        <TrendingUp className="w-7 h-7 text-gold-500" />
        Trending Now
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.slice(0, 4).map((product) => (
          <Link
            key={product.id}
            href={`/${country}/product/${product.id}`}
            className="group"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gradient-to-br from-cream-100 to-cream-200 flex items-center justify-center relative">
                <Sparkles className="w-16 h-16 text-gold-300" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-gold-600 transition-colors">
                  {product.name}
                </h3>
                <p className="mt-2 font-semibold text-gray-900">
                  {currency}{product.price.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
