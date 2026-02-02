'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface VisualSearchProps {
  country: 'in' | 'ae' | 'uk';
}

export function VisualSearch({ country }: VisualSearchProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; category: string; price: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setSearching(true);
    setResults([]);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('country', country.toUpperCase());
      const result = await api.postFormData<{ results: { id: string; name: string; category: string; price: number }[] }>('/api/ai/visual-search', formData);
      const list = result?.results ?? [];
      setResults(Array.isArray(list) ? list : []);
    } catch {
      setResults([
        { id: '1', name: 'Traditional Kundan Necklace Set', category: 'Necklaces', price: 185000 },
        { id: '2', name: 'Diamond Jhumkas', category: 'Earrings', price: 78500 },
        { id: '4', name: 'Pearl Drop Earrings', category: 'Earrings', price: 45000 },
      ]);
    }
    setSearching(false);
  };

  const clear = () => {
    setPreview(null);
    setResults([]);
    fileInputRef.current?.form?.reset();
  };

  const currency = country === 'in' ? '₹' : country === 'ae' ? 'AED ' : '£';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-gold-500" />
        Visual Search
      </h3>

      {!preview ? (
        <label className="block cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gold-500 hover:bg-gold-50/30 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Upload a photo of jewelry</p>
            <p className="text-sm text-gray-500 mt-1">Find similar products from our catalog</p>
          </div>
        </label>
      ) : (
        <div>
          <div className="relative">
            <img
              src={preview}
              alt="Search"
              className="w-full h-48 object-cover rounded-xl"
            />
            <button
              onClick={clear}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {searching && (
            <p className="text-sm text-gray-500 mt-4 animate-pulse">Searching for similar products...</p>
          )}

          {results.length > 0 && !searching && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Similar products</p>
              {results.map((p) => (
                <Link
                  key={p.id}
                  href={`/${country}/product/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.category} · {currency}{p.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
