'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Upload,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MapPin,
  Eye,
  Edit2,
  History,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';

interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  location: string;
  quantity: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved';
  lastUpdated: string;
  country: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', sku: 'GG-NKL-001', productName: 'Gold Necklace 22K', category: 'Necklaces', location: 'Mumbai Warehouse', quantity: 45, reserved: 5, available: 40, reorderPoint: 10, status: 'in_stock', lastUpdated: '2 hours ago', country: 'IN' },
  { id: '2', sku: 'GG-RNG-002', productName: 'Diamond Ring 18K', category: 'Rings', location: 'Mumbai Warehouse', quantity: 8, reserved: 3, available: 5, reorderPoint: 10, status: 'low_stock', lastUpdated: '1 hour ago', country: 'IN' },
  { id: '3', sku: 'GG-BNG-003', productName: 'Gold Bangles Set', category: 'Bangles', location: 'Delhi Warehouse', quantity: 0, reserved: 0, available: 0, reorderPoint: 15, status: 'out_of_stock', lastUpdated: '30 min ago', country: 'IN' },
  { id: '4', sku: 'GG-EAR-004', productName: 'Pearl Earrings', category: 'Earrings', location: 'Dubai Warehouse', quantity: 120, reserved: 20, available: 100, reorderPoint: 25, status: 'in_stock', lastUpdated: '4 hours ago', country: 'AE' },
  { id: '5', sku: 'GG-BRC-005', productName: 'Gold Bracelet 22K', category: 'Bracelets', location: 'London Warehouse', quantity: 35, reserved: 10, available: 25, reorderPoint: 20, status: 'in_stock', lastUpdated: '1 day ago', country: 'UK' },
  { id: '6', sku: 'GG-CHN-006', productName: 'Silver Chain', category: 'Chains', location: 'Mumbai Warehouse', quantity: 5, reserved: 5, available: 0, reorderPoint: 20, status: 'reserved', lastUpdated: '3 hours ago', country: 'IN' },
];

const statusConfig = {
  in_stock: { color: 'bg-green-100 text-green-700', label: 'In Stock' },
  low_stock: { color: 'bg-yellow-100 text-yellow-700', label: 'Low Stock' },
  out_of_stock: { color: 'bg-red-100 text-red-700', label: 'Out of Stock' },
  reserved: { color: 'bg-blue-100 text-blue-700', label: 'Reserved' },
};

export default function InventoryPage() {
  const toast = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const stats = {
    totalItems: inventory.reduce((sum, i) => sum + i.quantity, 0),
    lowStock: inventory.filter((i) => i.status === 'low_stock').length,
    outOfStock: inventory.filter((i) => i.status === 'out_of_stock').length,
    reserved: inventory.reduce((sum, i) => sum + i.reserved, 0),
  };

  const filteredInventory = inventory.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (countryFilter && item.country !== countryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast.success('Inventory refreshed');
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Inventory' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage stock levels across all locations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors">
            <Upload className="w-4 h-4" />
            Import Stock
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
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reserved</p>
              <p className="text-2xl font-bold text-purple-600">{stats.reserved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="">All Locations</option>
              <option value="IN">India</option>
              <option value="AE">UAE</option>
              <option value="UK">UK</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="reserved">Reserved</option>
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
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
                <th className="px-6 py-4 font-medium text-right">Reserved</th>
                <th className="px-6 py-4 font-medium text-right">Available</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Updated</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const statusInfo = statusConfig[item.status];
                const isLow = item.available <= item.reorderPoint && item.available > 0;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{item.sku}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {item.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{item.reserved}</td>
                    <td className={`px-6 py-4 text-right font-medium ${isLow ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {item.available}
                      {isLow && <AlertTriangle className="w-4 h-4 inline ml-1" />}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.lastUpdated}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="History">
                          <History className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredInventory.length} of {inventory.length} items
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
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
