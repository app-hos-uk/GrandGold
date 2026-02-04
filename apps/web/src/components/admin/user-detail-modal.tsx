'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  CreditCard,
  Shield,
  Edit2,
  Loader2,
  Check,
  UserCog,
  Ban,
  Key,
  History,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/format';

interface UserDetailProps {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    country?: string;
    status?: string;
    orders?: number;
    spent?: number;
    createdAt?: string;
    kycStatus?: string;
    kycTier?: number;
    lastLoginAt?: string;
    addresses?: Array<{
      id: string;
      type: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    }>;
  };
  onClose: () => void;
  onRoleChange?: (userId: string, role: string, country?: string) => Promise<void>;
  onStatusChange?: (userId: string, status: string) => Promise<void>;
  onUpdate?: (userId: string, data: { firstName?: string; lastName?: string; phone?: string }) => Promise<void>;
  onDelete?: (userId: string) => Promise<void>;
  currentUserRole?: string;
  currentUserCountry?: string;
}

const ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'seller', label: 'Seller' },
  { value: 'support', label: 'Support Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'country_admin', label: 'Country Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const COUNTRIES = ['IN', 'AE', 'UK'] as const;

const roleBadgeColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  country_admin: 'bg-blue-100 text-blue-800',
  manager: 'bg-indigo-100 text-indigo-800',
  support: 'bg-slate-100 text-slate-800',
  seller: 'bg-gold-100 text-gold-800',
  customer: 'bg-gray-100 text-gray-700',
};

const kycStatusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  none: 'bg-gray-100 text-gray-500',
};

export function UserDetailModal({ user, onClose, onRoleChange, onStatusChange, onUpdate, onDelete, currentUserRole, currentUserCountry }: UserDetailProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'orders' | 'security'>('details');
  const [editingRole, setEditingRole] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role || 'customer');
  const [selectedCountry, setSelectedCountry] = useState(user.country || 'IN');
  const [editForm, setEditForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Unknown';
  const initial = displayName[0]?.toUpperCase() || '?';
  const isSuperAdmin = currentUserRole === 'super_admin';
  const isCountryAdmin = currentUserRole === 'country_admin';
  const canEditRole = isSuperAdmin && user.role !== 'super_admin';
  
  // Country admins can edit users in their country (except admins)
  // Super admins can edit any user
  const canEditDetails = isSuperAdmin || 
    (isCountryAdmin && user.country === currentUserCountry && user.role !== 'super_admin' && user.role !== 'country_admin');

  const handleRoleSave = async () => {
    if (!onRoleChange) return;
    setSaving(true);
    try {
      await onRoleChange(user.id, selectedRole, selectedRole === 'country_admin' ? selectedCountry : undefined);
      setSuccess('Role updated successfully');
      setTimeout(() => setSuccess(null), 2000);
      setEditingRole(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDetailsSave = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(user.id, editForm);
      setSuccess('User details updated successfully');
      setTimeout(() => setSuccess(null), 2000);
      setEditingDetails(false);
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async () => {
    if (!onStatusChange) return;
    if (!confirm(`${user.status === 'blocked' ? 'Unblock' : 'Block'} this user?`)) return;
    setSaving(true);
    try {
      await onStatusChange(user.id, user.status === 'blocked' ? 'active' : 'blocked');
      setSuccess('Status updated');
      setTimeout(() => setSuccess(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`Are you sure you want to delete this user? This action cannot be undone.`)) return;
    setSaving(true);
    try {
      await onDelete(user.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gold-600">{initial}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeColors[user.role ?? 'customer'] ?? 'bg-gray-100'}`}>
                    {user.role?.replace(/_/g, ' ') || 'Customer'}
                  </span>
                  {user.country && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{user.country}</span>
                  )}
                  {user.status === 'blocked' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      Blocked
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-100 -mb-6">
            {(['details', 'orders', 'security'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-gold-500 text-gold-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 text-green-700 rounded-lg text-sm">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Editable User Details */}
              {canEditDetails && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">User Details</h3>
                    {!editingDetails && (
                      <button
                        onClick={() => setEditingDetails(true)}
                        className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Details
                      </button>
                    )}
                  </div>
                  {editingDetails ? (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingDetails(false);
                            setEditForm({
                              firstName: user.firstName || '',
                              lastName: user.lastName || '',
                              phone: user.phone || '',
                            });
                          }}
                          className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDetailsSave}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <UserCog className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">First Name</p>
                          <p className="text-sm font-medium text-gray-900">{user.firstName || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <UserCog className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Last Name</p>
                          <p className="text-sm font-medium text-gray-900">{user.lastName || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg col-span-2">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{user.phone || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Info (read-only) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{user.email || '—'}</p>
                    </div>
                  </div>
                  {!canEditDetails && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{user.phone || '—'}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Country</p>
                      <p className="text-sm font-medium text-gray-900">{user.country || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Member Since</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.createdAt ? formatRelativeDate(user.createdAt) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">KYC Status</h3>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${kycStatusColors[user.kycStatus ?? 'none']}`}>
                        {user.kycStatus ? user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1) : 'Not Started'}
                      </span>
                      {user.kycTier && (
                        <span className="text-sm text-gray-600">Tier {user.kycTier}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {user.kycStatus === 'verified' || user.kycStatus === 'approved'
                        ? 'Identity verified. User can make high-value purchases.'
                        : 'KYC verification pending or not started.'}
                    </p>
                  </div>
                  <a href={`/admin/kyc?user=${user.id}`} className="text-sm text-gold-600 hover:text-gold-700">
                    View Details
                  </a>
                </div>
              </div>

              {/* Role Management */}
              {canEditRole && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Role & Permissions</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {editingRole ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          >
                            {ROLES.filter((r) => r.value !== 'super_admin' || isSuperAdmin).map((role) => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </div>
                        {selectedRole === 'country_admin' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Country</label>
                            <select
                              value={selectedCountry}
                              onChange={(e) => setSelectedCountry(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                            >
                              {COUNTRIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingRole(false)}
                            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRoleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserCog className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {user.role?.replace(/_/g, ' ') || 'Customer'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.role === 'country_admin' ? `Assigned to ${user.country}` : 'Click edit to change role'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingRole(true)}
                          className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit Role
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Addresses */}
              {user.addresses && user.addresses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Addresses</h3>
                  <div className="space-y-2">
                    {user.addresses.map((addr) => (
                      <div key={addr.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase mb-1">{addr.type}</p>
                        <p className="text-sm text-gray-900">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                        </p>
                        <p className="text-sm text-gray-600">
                          {addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.postalCode}
                        </p>
                        <p className="text-sm text-gray-500">{addr.country}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{user.orders ?? 0}</p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <CreditCard className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">₹{(user.spent ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                  </div>
                </div>
              </div>
              <div className="text-center py-8">
                <a
                  href={`/admin/orders?user=${user.id}`}
                  className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
                >
                  View All Orders
                  <History className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Key className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">Last changed: Unknown</p>
                </div>
                <button className="text-sm text-gold-600 hover:text-gold-700">Reset Password</button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Status: Unknown</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Last Login</p>
                  <p className="text-xs text-gray-500">
                    {user.lastLoginAt ? formatRelativeDate(user.lastLoginAt) : 'Unknown'}
                  </p>
                </div>
              </div>

              {canEditDetails && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Danger Zone
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {onStatusChange && (
                      <button
                        onClick={handleBlock}
                        disabled={saving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                          user.status === 'blocked'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        {user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete User
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
