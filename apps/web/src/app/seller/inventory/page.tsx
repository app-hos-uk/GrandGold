'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  AlertTriangle,
  Package,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Sparkles,
  Edit,
  Save,
  X,
} from 'lucide-react';

const inventory = [
  { id: 1, name: 'Traditional Kundan Necklace Set', sku: 'GG-NK-001', category: 'Necklaces', stock: 12, reserved: 2, available: 10, threshold: 5, status: 'healthy' },
  { id: 2, name: 'Diamond Studded Jhumkas', sku: 'GG-ER-002', category: 'Earrings', stock: 25, reserved: 3, available: 22, threshold: 5, status: 'healthy' },
  { id: 3, name: 'Solitaire Engagement Ring', sku: 'GG-RG-003', category: 'Rings', stock: 2, reserved: 1, available: 1, threshold: 5, status: 'low' },
  { id: 4, name: 'Classic Gold Bangle Set', sku: 'GG-BR-004', category: 'Bracelets', stock: 15, reserved: 0, available: 15, threshold: 5, status: 'healthy' },
  { id: 5, name: 'Temple Design Choker', sku: 'GG-NK-005', category: 'Necklaces', stock: 0, reserved: 0, available: 0, threshold: 5, status: 'out' },
  { id: 6, name: 'Pearl Drop Earrings', sku: 'GG-ER-006', category: 'Earrings', stock: 32, reserved: 5, available: 27, threshold: 5, status: 'healthy' },
  { id: 7, name: 'Diamond Eternity Band', sku: 'GG-RG-007', category: 'Rings', stock: 3, reserved: 1, available: 2, threshold: 5, status: 'low' },
  { id: 8, name: 'Charm Bracelet', sku: 'GG-BR-008', category: 'Bracelets', stock: 20, reserved: 2, available: 18, threshold: 5, status: 'healthy' },
];

const statusConfig = {
  healthy: { label: 'In Stock', color: 'bg-green-100 text-green-700' },
  low: { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' },
  out: { label: 'Out of Stock', color: 'bg-red-100 text-red-700' },
};

export default function SellerInventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredInventory = inventory.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleEdit = (id: number, currentStock: number) => {
    setEditingId(id);
    setEditValue(currentStock.toString());
  };

  const handleSave = () => {
    // Save logic here
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Manage stock levels for your products</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors">
            <Upload className="w-4 h-4" />
            Bulk Update
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-xl font-bold text-gray-900">109</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Stock</p>
              <p className="text-xl font-bold text-green-600">95</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-xl font-bold text-yellow-600">11</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
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
            <option value="healthy">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Total Stock</th>
                <th className="px-6 py-4 font-medium">Reserved</th>
                <th className="px-6 py-4 font-medium">Available</th>
                <th className="px-6 py-4 font-medium">Threshold</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-gold-400" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{item.sku}</td>
                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 px-2 py-1 border border-gold-500 rounded focus:outline-none focus:ring-2 focus:ring-gold-500"
                        autoFocus
                      />
                    ) : (
                      <span className={item.stock === 0 ? 'text-red-600 font-semibold' : 'text-gray-900 font-semibold'}>
                        {item.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.reserved}</td>
                  <td className="px-6 py-4">
                    <span className={item.available === 0 ? 'text-red-600 font-semibold' : item.available < item.threshold ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'}>
                      {item.available}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.threshold}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusConfig[item.status as keyof typeof statusConfig].color
                    }`}>
                      {statusConfig[item.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleSave}
                          className="p-2 hover:bg-green-50 rounded-lg"
                        >
                          <Save className="w-4 h-4 text-green-500" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(item.id, item.stock)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredInventory.length} of {inventory.length} items
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 bg-gold-500 text-white rounded-lg">1</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
