'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatCurrency } from '@/lib/format';
import { TableRowSkeleton, StatCardSkeleton } from '@/components/admin/skeleton';

const FALLBACK: ProductRow[] = [
  { id: '1', name: 'Traditional Kundan Necklace Set', sku: 'GG-NK-001', category: 'Necklaces', price: 185000, stock: 12, status: 'active' },
  { id: '2', name: 'Diamond Studded Jhumkas', sku: 'GG-ER-002', category: 'Earrings', price: 78500, stock: 25, status: 'active' },
  { id: '3', name: 'Solitaire Engagement Ring', sku: 'GG-RG-003', category: 'Rings', price: 245000, stock: 8, status: 'active' },
];

const statusColors = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-700',
  out_of_stock: 'bg-red-100 text-red-700',
  low_stock: 'bg-yellow-100 text-yellow-700',
};

const statusLabels = {
  active: 'Active',
  draft: 'Draft',
  out_of_stock: 'Out of Stock',
  low_stock: 'Low Stock',
};

interface ProductRow {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  price?: number;
  stock?: number;
  status?: string;
  sellerId?: string;
  imageUrl?: string;
  image?: string;
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ total: number; active: number; out_of_stock: number; low_stock: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getProducts({ page, limit: 20, category: categoryFilter !== 'all' ? categoryFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined })
      .then((res) => {
        const d = res as unknown as { data?: ProductRow[]; total?: number };
        const list = Array.isArray(d?.data) ? d.data : [];
        setProducts(list);
        setTotal(d?.total ?? list.length);
      })
      .catch(() => setProducts(FALLBACK))
      .finally(() => setLoading(false));
  }, [page, categoryFilter, statusFilter]);

  useEffect(() => {
    Promise.all([
      adminApi.getProducts({ limit: 1 }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getProducts({ limit: 1, status: 'active' }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getProducts({ limit: 1, status: 'out_of_stock' }).then((r: unknown) => (r as { total?: number }).total ?? 0),
      adminApi.getProducts({ limit: 1, status: 'low_stock' }).then((r: unknown) => (r as { total?: number }).total ?? 0),
    ])
      .then(([totalCount, active, out_of_stock, low_stock]) => setStats({ total: totalCount, active, out_of_stock, low_stock }))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const filteredProducts = products.filter((product) => {
    if (statusFilter !== 'all' && product.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
    if (searchQuery && !product.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(product.sku || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Products' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats - clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          [
            { key: 'all', label: 'Total Products', value: stats?.total ?? 0, color: 'text-gray-900' },
            { key: 'active', label: 'Active', value: stats?.active ?? 0, color: 'text-green-600' },
            { key: 'out_of_stock', label: 'Out of Stock', value: stats?.out_of_stock ?? 0, color: 'text-red-600' },
            { key: 'low_stock', label: 'Low Stock', value: stats?.low_stock ?? 0, color: 'text-yellow-600' },
          ].map((stat) => (
            <button
              key={stat.key}
              type="button"
              onClick={() => { setStatusFilter(stat.key === 'all' ? 'all' : stat.key); setPage(1); }}
              className="bg-white rounded-xl p-4 shadow-sm text-left hover:ring-2 hover:ring-gold-200 transition"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</span>
            </button>
          ))
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Categories</option>
              <option value="Necklaces">Necklaces</option>
              <option value="Earrings">Earrings</option>
              <option value="Rings">Rings</option>
              <option value="Bracelets">Bracelets</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock</option>
            </select>
            <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50" aria-label="More filters">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-t border-b border-gray-100">
                <th className="px-6 py-4 font-medium">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={9} />)
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">No products found.</td>
                </tr>
              ) : filteredProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-b border-gray-50 hover:bg-gray-50 ${(product.stock ?? 0) < 10 ? 'bg-amber-50/50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {(product.imageUrl || product.image) ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={product.imageUrl || product.image || ''} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-6 h-6 text-gold-400" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{product.sku ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{product.category ?? '—'}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(product.price ?? 0)}</td>
                  <td className="px-6 py-4">
                    <span className={(product.stock ?? 0) === 0 ? 'text-red-600 font-medium' : (product.stock ?? 0) < 10 ? 'text-yellow-600 font-medium' : 'text-gray-900'}>
                      {product.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusColors[product.status as keyof typeof statusColors] ?? 'bg-gray-100 text-gray-700'
                    }`}>
                      {statusLabels[product.status as keyof typeof statusLabels] ?? product.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.sellerId || '–'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button type="button" className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button type="button" className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button type="button" className="p-2 hover:bg-gray-100 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `Showing ${filteredProducts.length} of ${total} products`}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button type="button" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
