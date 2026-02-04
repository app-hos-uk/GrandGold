'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
  Sparkles,
  Copy,
} from 'lucide-react';

const products = [
  { id: 1, name: 'Traditional Kundan Necklace Set', sku: 'GG-NK-001', category: 'Necklaces', price: 185000, stock: 12, status: 'active', views: 1245, sales: 28 },
  { id: 2, name: 'Diamond Studded Jhumkas', sku: 'GG-ER-002', category: 'Earrings', price: 78500, stock: 25, status: 'active', views: 987, sales: 45 },
  { id: 3, name: 'Solitaire Engagement Ring', sku: 'GG-RG-003', category: 'Rings', price: 245000, stock: 2, status: 'low_stock', views: 2156, sales: 18 },
  { id: 4, name: 'Classic Gold Bangle Set', sku: 'GG-BR-004', category: 'Bracelets', price: 125000, stock: 15, status: 'active', views: 756, sales: 32 },
  { id: 5, name: 'Temple Design Choker', sku: 'GG-NK-005', category: 'Necklaces', price: 295000, stock: 0, status: 'out_of_stock', views: 1834, sales: 12 },
  { id: 6, name: 'Pearl Drop Earrings', sku: 'GG-ER-006', category: 'Earrings', price: 45000, stock: 32, status: 'active', views: 654, sales: 56 },
  { id: 7, name: 'Diamond Eternity Band', sku: 'GG-RG-007', category: 'Rings', price: 165000, stock: 3, status: 'low_stock', views: 1432, sales: 22 },
  { id: 8, name: 'Charm Bracelet', sku: 'GG-BR-008', category: 'Bracelets', price: 55000, stock: 20, status: 'draft', views: 0, sales: 0 },
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

export default function SellerProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProducts = products.filter((product) => {
    if (statusFilter !== 'all' && product.status !== statusFilter) return false;
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-600">Manage your product listings</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/seller/products/bulk"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Bulk Upload
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <Link
            href="/seller/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Products', value: '48', color: 'text-gray-900' },
          { label: 'Active', value: '42', color: 'text-green-600' },
          { label: 'Out of Stock', value: '3', color: 'text-red-600' },
          { label: 'Draft', value: '3', color: 'text-gray-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-gray-100">
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Views</th>
                <th className="px-6 py-4 font-medium">Sales</th>
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
                      <div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-mono text-sm">{product.sku}</span>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={product.stock === 0 ? 'text-red-600 font-medium' : product.stock < 5 ? 'text-yellow-600 font-medium' : 'text-gray-900'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusColors[product.status as keyof typeof statusColors]
                    }`}>
                      {statusLabels[product.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{product.views.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{product.sales}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 bg-gold-500 text-white rounded-lg">1</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded-lg">2</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
