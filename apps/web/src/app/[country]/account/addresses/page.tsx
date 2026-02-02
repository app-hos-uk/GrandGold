'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Check,
  X,
  Home,
  Building,
} from 'lucide-react';

const initialAddresses = [
  {
    id: '1',
    type: 'home',
    name: 'Priya Sharma',
    address: '123 Gold Street, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '+91 98765 43210',
    isDefault: true,
  },
  {
    id: '2',
    type: 'office',
    name: 'Priya Sharma',
    address: '456 Business Park, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400093',
    phone: '+91 98765 43210',
    isDefault: false,
  },
];

export default function AddressesPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<typeof initialAddresses[0] | null>(null);
  const [formData, setFormData] = useState({
    type: 'home',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    isDefault: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id ? { ...formData, id: addr.id } : addr
      ));
    } else {
      setAddresses([...addresses, { ...formData, id: Date.now().toString() }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingAddress(null);
    setFormData({
      type: 'home',
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      isDefault: false,
    });
  };

  const handleEdit = (address: typeof initialAddresses[0]) => {
    setEditingAddress(address);
    setFormData(address);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const setAsDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    })));
  };

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href={`/${country}/account`} className="text-gray-500 hover:text-gold-600">
              My Account
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Addresses</span>
          </nav>
        </div>
      </div>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Saved Addresses</h1>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add New Address
              </button>
            </div>

            {/* Address List */}
            <div className="space-y-4">
              {addresses.map((address, index) => (
                <motion.div
                  key={address.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl p-6 ${
                    address.isDefault ? 'ring-2 ring-gold-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        address.type === 'home' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {address.type === 'home' ? (
                          <Home className={`w-5 h-5 ${address.type === 'home' ? 'text-blue-600' : 'text-purple-600'}`} />
                        ) : (
                          <Building className={`w-5 h-5 ${address.type === 'home' ? 'text-blue-600' : 'text-purple-600'}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 capitalize">{address.type}</span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-gold-100 text-gold-700 text-xs font-medium rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-800">{address.name}</p>
                        <p className="text-gray-600 text-sm mt-1">
                          {address.address}<br />
                          {address.city}, {address.state} {address.pincode}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">{address.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(address)}
                        className="p-2 text-gray-500 hover:text-gold-600 hover:bg-cream-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {!address.isDefault && (
                    <button
                      onClick={() => setAsDefault(address.id)}
                      className="mt-4 text-sm text-gold-600 hover:text-gold-700 font-medium"
                    >
                      Set as Default
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {addresses.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No addresses saved</h3>
                <p className="text-gray-600 mb-6">Add a delivery address to get started</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Address
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={resetForm}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-cream-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Address Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Type
                </label>
                <div className="flex gap-3">
                  {['home', 'office'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`flex-1 py-3 px-4 rounded-lg capitalize flex items-center justify-center gap-2 transition-all ${
                        formData.type === type
                          ? 'bg-gold-500 text-white'
                          : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
                      }`}
                    >
                      {type === 'home' ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="House/Flat no., Building name, Street"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Default Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-gold-500 rounded focus:ring-gold-500"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
