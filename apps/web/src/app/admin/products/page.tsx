'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';

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
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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

  const filteredProducts = products.filter((product) => {
    if (statusFilter !== 'all' && product.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
    if (searchQuery && !product.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(product.sku || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Products', value: '856', change: '+12 this week' },
          { label: 'Active', value: '742', color: 'text-green-600' },
          { label: 'Out of Stock', value: '28', color: 'text-red-600' },
          { label: 'Low Stock', value: '45', color: 'text-yellow-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <span className={`text-2xl font-bold ${stat.color || 'text-gray-900'}`}>{stat.value}</span>
              {stat.change && <span className="text-sm text-gray-500">{stat.change}</span>}
            </div>
          </div>
        ))}
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
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
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
              {filteredProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-gold-400" />
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                  <td className="px-6 py-4 text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ₹{(product.price ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={(product.stock ?? 0) === 0 ? 'text-red-600' : (product.stock ?? 0) < 10 ? 'text-yellow-600' : 'text-gray-900'}>
                      {product.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusColors[product.status as keyof typeof statusColors]
                    }`}>
                      {statusLabels[product.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.sellerId || '–'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Delete">
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
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 bg-gold-500 text-white rounded-lg">1</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded-lg">2</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded-lg">3</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
