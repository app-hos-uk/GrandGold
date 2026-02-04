'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  Users,
  ShoppingCart,
  Package,
  Store,
  CreditCard,
  BarChart3,
  Settings,
  FileText,
  UserCog,
  Globe,
  Lock,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';
import { adminApi, RoleData, ApiError } from '@/lib/api';

// Permission categories and their individual permissions
const PERMISSION_CATEGORIES = {
  users: {
    label: 'Users',
    icon: Users,
    permissions: [
      { key: 'users.view', label: 'View Users' },
      { key: 'users.create', label: 'Create Users' },
      { key: 'users.edit', label: 'Edit Users' },
      { key: 'users.delete', label: 'Delete Users' },
      { key: 'users.assign_role', label: 'Assign Roles' },
    ],
  },
  orders: {
    label: 'Orders',
    icon: ShoppingCart,
    permissions: [
      { key: 'orders.view', label: 'View Orders' },
      { key: 'orders.update_status', label: 'Update Status' },
      { key: 'orders.cancel', label: 'Cancel Orders' },
      { key: 'orders.refund', label: 'Process Refunds' },
    ],
  },
  products: {
    label: 'Products',
    icon: Package,
    permissions: [
      { key: 'products.view', label: 'View Products' },
      { key: 'products.create', label: 'Create Products' },
      { key: 'products.edit', label: 'Edit Products' },
      { key: 'products.delete', label: 'Delete Products' },
      { key: 'products.approve', label: 'Approve Products' },
    ],
  },
  sellers: {
    label: 'Sellers',
    icon: Store,
    permissions: [
      { key: 'sellers.view', label: 'View Sellers' },
      { key: 'sellers.approve', label: 'Approve Sellers' },
      { key: 'sellers.suspend', label: 'Suspend Sellers' },
      { key: 'sellers.edit', label: 'Edit Seller Info' },
    ],
  },
  payments: {
    label: 'Payments',
    icon: CreditCard,
    permissions: [
      { key: 'payments.view', label: 'View Payments' },
      { key: 'payments.refund', label: 'Process Refunds' },
      { key: 'payments.settlements', label: 'View Settlements' },
    ],
  },
  reports: {
    label: 'Reports',
    icon: BarChart3,
    permissions: [
      { key: 'reports.view', label: 'View Reports' },
      { key: 'reports.export', label: 'Export Reports' },
      { key: 'reports.analytics', label: 'View Analytics' },
    ],
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    permissions: [
      { key: 'settings.view', label: 'View Settings' },
      { key: 'settings.edit', label: 'Edit Settings' },
      { key: 'settings.api_keys', label: 'Manage API Keys' },
    ],
  },
  kyc: {
    label: 'KYC',
    icon: FileText,
    permissions: [
      { key: 'kyc.view', label: 'View KYC' },
      { key: 'kyc.approve', label: 'Approve KYC' },
      { key: 'kyc.reject', label: 'Reject KYC' },
    ],
  },
};

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  scope: 'global' | 'country';
  country?: string | null;
  permissions: string[];
  userCount: number;
}

const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
  { value: 'UK', label: 'United Kingdom' },
] as const;

// Default system roles (shown when API is unavailable)
const DEFAULT_ROLES: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full access to all features across all countries',
    isSystem: true,
    scope: 'global' as const,
    permissions: Object.values(PERMISSION_CATEGORIES).flatMap((cat) =>
      cat.permissions.map((p) => p.key)
    ),
    userCount: 1,
  },
  {
    id: 'country_admin',
    name: 'Country Admin',
    description: 'Full access to features within assigned country',
    isSystem: true,
    scope: 'country' as const,
    permissions: [
      'users.view', 'users.create', 'users.edit',
      'orders.view', 'orders.update_status', 'orders.cancel', 'orders.refund',
      'products.view', 'products.approve',
      'sellers.view', 'sellers.approve', 'sellers.suspend',
      'payments.view', 'payments.refund',
      'reports.view', 'reports.export',
      'kyc.view', 'kyc.approve', 'kyc.reject',
    ],
    userCount: 3,
  },
];

export default function RolesPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    scope: 'country' as 'global' | 'country',
    country: '' as string,
    permissions: [] as string[],
  });

  // Load roles from API
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getRoles();
      const apiRoles = (res as { roles?: RoleData[] })?.roles || [];
      if (apiRoles.length > 0) {
        setRoles(apiRoles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          isSystem: r.isSystem,
          scope: r.scope,
          country: r.country,
          permissions: r.permissions || [],
          userCount: r.userCount || 0,
        })));
      }
    } catch (err) {
      // Use default roles on error
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setEditMode(false);
    setCreateMode(false);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditForm({
      name: role.name,
      description: role.description,
      scope: role.scope,
      country: role.country || '',
      permissions: [...role.permissions],
    });
    setEditMode(true);
    setCreateMode(false);
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setEditForm({
      name: '',
      description: '',
      scope: 'country',
      country: 'IN',
      permissions: [],
    });
    setEditMode(false);
    setCreateMode(true);
  };

  const togglePermission = (permKey: string) => {
    setEditForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter((p) => p !== permKey)
        : [...prev.permissions, permKey],
    }));
  };

  const toggleCategory = (catKey: string) => {
    const cat = PERMISSION_CATEGORIES[catKey as keyof typeof PERMISSION_CATEGORIES];
    const catPermKeys = cat.permissions.map((p) => p.key);
    const allSelected = catPermKeys.every((k) => editForm.permissions.includes(k));

    setEditForm((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !catPermKeys.includes(p))
        : [...new Set([...prev.permissions, ...catPermKeys])],
    }));
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (editForm.scope === 'country' && !editForm.country) {
      toast.error('Please select a country for country-scoped roles');
      return;
    }

    setSaving(true);

    try {
      if (createMode) {
        const res = await adminApi.createRole({
          name: editForm.name.trim(),
          description: editForm.description,
          scope: editForm.scope,
          country: editForm.scope === 'country' ? editForm.country : undefined,
          permissions: editForm.permissions,
        });
        const newRole = (res as { role?: RoleData })?.role;
        if (newRole) {
          setRoles((prev) => [...prev, {
            id: newRole.id,
            name: newRole.name,
            description: newRole.description || '',
            scope: newRole.scope,
            country: newRole.country,
            permissions: newRole.permissions || [],
            isSystem: newRole.isSystem,
            userCount: newRole.userCount || 0,
          }]);
          setSelectedRole({
            id: newRole.id,
            name: newRole.name,
            description: newRole.description || '',
            scope: newRole.scope,
            country: newRole.country,
            permissions: newRole.permissions || [],
            isSystem: newRole.isSystem,
            userCount: newRole.userCount || 0,
          });
        }
        toast.success('Role created successfully');
      } else if (selectedRole) {
        const res = await adminApi.updateRole(selectedRole.id, {
          name: editForm.name.trim(),
          description: editForm.description,
          scope: editForm.scope,
          country: editForm.scope === 'country' ? editForm.country : undefined,
          permissions: editForm.permissions,
        });
        const updatedRole = (res as { role?: RoleData })?.role;
        if (updatedRole) {
          setRoles((prev) =>
            prev.map((r) =>
              r.id === selectedRole.id
                ? {
                    ...r,
                    name: updatedRole.name,
                    description: updatedRole.description || '',
                    permissions: updatedRole.permissions || [],
                    scope: updatedRole.scope,
                    country: updatedRole.country,
                  }
                : r
            )
          );
          setSelectedRole((prev) =>
            prev
              ? {
                  ...prev,
                  name: updatedRole.name,
                  description: updatedRole.description || '',
                  permissions: updatedRole.permissions || [],
                  scope: updatedRole.scope,
                  country: updatedRole.country,
                }
              : prev
          );
        }
        toast.success('Role updated successfully');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save role';
      toast.error(msg);
    } finally {
      setSaving(false);
      setEditMode(false);
      setCreateMode(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      toast.error('Cannot delete system roles');
      return;
    }
    if (!confirm(`Delete role "${role.name}"? Users with this role will be set to "customer".`)) return;

    try {
      await adminApi.deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      if (selectedRole?.id === role.id) setSelectedRole(null);
      toast.success('Role deleted');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete role';
      toast.error(msg);
    }
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Roles & Permissions' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600">Manage user roles and their access permissions</p>
        </div>
        <button
          onClick={handleCreateRole}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 space-y-3">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer border-2 transition-colors ${
                selectedRole?.id === role.id ? 'border-gold-500' : 'border-transparent hover:border-gold-200'
              }`}
              onClick={() => handleSelectRole(role)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    role.scope === 'global' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    {role.scope === 'global' ? (
                      <Globe className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Shield className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      {role.isSystem && (
                        <span title="System role"><Lock className="w-3.5 h-3.5 text-gray-400" /></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{role.userCount} users</p>
                  </div>
                </div>
                {!role.isSystem && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditRole(role); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(role); }}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{role.description}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  role.scope === 'global' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {role.scope === 'global' ? 'Global' : role.country ? `${role.country} only` : 'Country-scoped'}
                </span>
                <span className="text-xs text-gray-500">
                  {role.permissions.length} permissions
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Role Details / Edit Form */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {(selectedRole || createMode) ? (
              <motion.div
                key={createMode ? 'create' : selectedRole?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl shadow-sm"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      {editMode || createMode ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Role Name"
                          className="text-xl font-bold text-gray-900 border-b-2 border-gold-500 focus:outline-none bg-transparent"
                        />
                      ) : (
                        <h2 className="text-xl font-bold text-gray-900">{selectedRole?.name}</h2>
                      )}
                      {editMode || createMode ? (
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Role description"
                          className="text-gray-600 mt-1 w-full border-b border-gray-200 focus:outline-none focus:border-gold-500 bg-transparent"
                        />
                      ) : (
                        <p className="text-gray-600 mt-1">{selectedRole?.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editMode || createMode ? (
                        <>
                          <button
                            onClick={() => { setEditMode(false); setCreateMode(false); }}
                            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </>
                      ) : (
                        !selectedRole?.isSystem && (
                          <button
                            onClick={() => selectedRole && handleEditRole(selectedRole)}
                            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Role
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {(editMode || createMode) && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={editForm.scope === 'country'}
                              onChange={() => setEditForm((prev) => ({ ...prev, scope: 'country', country: prev.country || 'IN' }))}
                              className="text-gold-500"
                            />
                            <span className="text-sm">Country-scoped</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={editForm.scope === 'global'}
                              onChange={() => setEditForm((prev) => ({ ...prev, scope: 'global', country: '' }))}
                              className="text-gold-500"
                            />
                            <span className="text-sm">Global</span>
                          </label>
                        </div>
                      </div>
                      {editForm.scope === 'country' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                          <select
                            value={editForm.country}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          >
                            <option value="">Select a country</option>
                            {COUNTRIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">This role will only be available for users in the selected country.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Permissions Grid */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Permissions</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(PERMISSION_CATEGORIES).map(([catKey, cat]) => {
                      const CatIcon = cat.icon;
                      const currentPerms = editMode || createMode ? editForm.permissions : (selectedRole?.permissions ?? []);
                      const catPermKeys = cat.permissions.map((p) => p.key);
                      const allSelected = catPermKeys.every((k) => currentPerms.includes(k));
                      const someSelected = catPermKeys.some((k) => currentPerms.includes(k));

                      return (
                        <div key={catKey} className="border border-gray-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CatIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{cat.label}</span>
                            </div>
                            {(editMode || createMode) && (
                              <button
                                onClick={() => toggleCategory(catKey)}
                                className={`text-xs px-2 py-1 rounded ${
                                  allSelected ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {cat.permissions.map((perm) => {
                              const isEnabled = currentPerms.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  className={`flex items-center gap-2 text-sm ${
                                    editMode || createMode ? 'cursor-pointer' : ''
                                  }`}
                                >
                                  {editMode || createMode ? (
                                    <input
                                      type="checkbox"
                                      checked={isEnabled}
                                      onChange={() => togglePermission(perm.key)}
                                      className="rounded text-gold-500 focus:ring-gold-500"
                                    />
                                  ) : (
                                    <span className={`w-4 h-4 rounded flex items-center justify-center ${
                                      isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                      {isEnabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    </span>
                                  )}
                                  <span className={isEnabled ? 'text-gray-900' : 'text-gray-500'}>
                                    {perm.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Users with this role */}
                {selectedRole && !createMode && (
                  <div className="p-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Users with this Role</h3>
                      <a href={`/admin/users?role=${selectedRole.id}`} className="text-sm text-gold-600 hover:text-gold-700">
                        View All →
                      </a>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {selectedRole.userCount} users currently have the {selectedRole.name} role.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm p-12 text-center"
              >
                <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Role</h3>
                <p className="text-gray-500 mb-4">
                  Choose a role from the list to view or edit its permissions
                </p>
                <button
                  onClick={handleCreateRole}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
                >
                  <Plus className="w-4 h-4" />
                  Create New Role
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
