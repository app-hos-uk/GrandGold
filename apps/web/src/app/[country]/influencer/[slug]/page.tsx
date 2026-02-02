'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShoppingBag, Wallet, TrendingUp } from 'lucide-react';
import { influencerApi } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price?: number;
  images?: string[];
  category?: string;
}

interface Rack {
  slug: string;
  name: string;
  bio: string;
  products: Product[];
}

const FALLBACK_RACKS: Record<string, Rack> = {
  priya: {
    slug: 'priya',
    name: "Priya's Picks",
    bio: 'Bridal & traditional jewellery curated by fashion influencer Priya',
    products: [
      { id: '1', name: 'Traditional Kundan Necklace Set', price: 185000 },
      { id: '3', name: 'Temple Choker Set', price: 295000 },
      { id: '5', name: 'Gold Chandbalis', price: 95000 },
    ],
  },
  rahul: {
    slug: 'rahul',
    name: "Rahul's Collection",
    bio: 'Contemporary & investment pieces selected by Rahul',
    products: [
      { id: '3', name: 'Temple Choker Set', price: 295000 },
      { id: '7', name: 'Solitaire Ring', price: 245000 },
      { id: '4', name: 'Pearl Drop Earrings', price: 45000 },
    ],
  },
};

export default function InfluencerStorefrontPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const slug = params.slug as string;

  const [rack, setRack] = useState<Rack | null>(null);
  const [commission, setCommission] = useState<{ total: number; pending: number; paid: number; orders: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const currency = country === 'in' ? '₹' : country === 'ae' ? 'AED ' : '£';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      influencerApi.getRack(slug).then((r) => r?.data?.rack ?? null),
      influencerApi.getCommission(slug).then((r) => r?.data ?? null).catch(() => null),
    ])
      .then(([r, c]) => {
        const rackData = r as Rack | null;
        setRack(rackData ?? FALLBACK_RACKS[slug] ?? null);
        setCommission(c);
      })
      .catch(() => setRack(FALLBACK_RACKS[slug] ?? null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading && !rack) {
    return (
      <main className="min-h-screen bg-cream-50 py-20 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </main>
    );
  }

  if (!rack) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Store not found</h1>
          <Link href={`/${country}`} className="text-gold-600 hover:underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const products = rack.products?.length ? rack.products : FALLBACK_RACKS[slug]?.products ?? [];

  return (
    <main className="min-h-screen bg-cream-50">
      <div className="bg-gradient-luxury py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-gray-900 mb-2">
            {rack.name}
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">{rack.bio}</p>
        </div>
      </div>

      {/* Commission & Payout (if influencer) */}
      {commission && (
        <section className="py-6 bg-white border-b border-cream-200">
          <div className="container mx-auto px-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gold-600" />
              Earnings
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-cream-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Total Commission</p>
                <p className="text-xl font-bold text-gray-900">{currency}{commission.total.toLocaleString()}</p>
              </div>
              <div className="bg-cream-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{currency}{commission.pending.toLocaleString()}</p>
              </div>
              <div className="bg-cream-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-xl font-bold text-green-600">{currency}{commission.paid.toLocaleString()}</p>
              </div>
              <div className="bg-cream-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Orders</p>
                <p className="text-xl font-bold text-gray-900">{commission.orders}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-600" />
            Curated Collection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/${country}/product/${product.id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-gold-100 to-cream-200 flex items-center justify-center relative overflow-hidden">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    ) : (
                      <Sparkles className="w-16 h-16 text-gold-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-gold-600">
                      {product.name}
                    </h3>
                    <p className="mt-2 font-semibold text-gray-900">
                      {currency}{(product.price ?? 0).toLocaleString()}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 text-sm text-gold-600">
                      <ShoppingBag className="w-4 h-4" />
                      Shop now
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 text-center">
        <Link
          href={`/${country}/collections`}
          className="text-gold-600 hover:underline font-medium"
        >
          View full collection →
        </Link>
      </div>
    </main>
  );
}
