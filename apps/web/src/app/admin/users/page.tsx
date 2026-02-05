'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  X,
  Loader2,
  CheckCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { authApi, adminApi, ApiError } from '@/lib/api';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatRelativeDate } from '@/lib/format';
import { useToast } from '@/components/admin/toast';
import { UserDetailModal } from '@/components/admin/user-detail-modal';

interface UserRow {
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
  joined?: string;
  kycStatus?: string;
}

const roleBadgeColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  country_admin: 'bg-blue-100 text-blue-800',
  manager: 'bg-indigo-100 text-indigo-800',
  staff: 'bg-slate-100 text-slate-800',
  seller: 'bg-gold-100 text-gold-800',
  customer: 'bg-gray-100 text-gray-700',
};

const FALLBACK_USERS: UserRow[] = [
  { id: '1', name: 'Priya Sharma', firstName: 'Priya', lastName: 'Sharma', email: 'priya@email.com', phone: '+91 98765 43210', status: 'active', orders: 12, spent: 485000, joined: '15 Jan 2024' },
  { id: '2', name: 'Rahul Mehta', firstName: 'Rahul', lastName: 'Mehta', email: 'rahul@email.com', phone: '+91 98765 43211', status: 'active', orders: 8, spent: 325000, joined: '20 Jan 2024' },
];

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  blocked: 'bg-red-100 text-red-700',
};

const COUNTRIES = ['IN', 'AE', 'UK'] as const;

export default function UsersPage() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [adminCountry, setAdminCountry] = useState<string | null>(null);
  const [roleActioning, setRoleActioning] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(null);
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    adminApi
      .getMe()
      .then((u) => {
        if (u?.role) setCurrentUserRole(u.role);
        if (u?.country) setAdminCountry(u.country);
        if (u?.role === 'country_admin' && u?.country) setCountryFilter(u.country);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getUsers({
        page,
        limit: 20,
        role: statusFilter !== 'all' ? statusFilter : undefined,
        country: countryFilter || undefined,
        search: searchQuery || undefined,
      })
      .then((res) => {
        const d = res as { users?: UserRow[]; total?: number };
        const list = Array.isArray(d?.users) ? d.users : [];
        setUsers(list.map((u) => ({
          ...u,
          name: u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
          status: u.status ?? (u.role === 'customer' ? 'active' : u.role),
          joined: u.createdAt ? formatRelativeDate(u.createdAt) : u.joined,
        })));
        setTotal(d?.total ?? list.length);
      })
      .catch(() => setUsers(FALLBACK_USERS))
      .finally(() => setLoading(false));
  }, [page, statusFilter, countryFilter, searchQuery, refreshKey]);

  const filteredUsers = users.filter((user) => {
    if (statusFilter !== 'all' && user.status !== statusFilter && user.role !== statusFilter) return false;
    if (searchQuery && !(user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(user.email || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Users' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage your customer accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => {
              const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Country', 'Created'];
              const csvRows = [headers.join(',')];
              filteredUsers.forEach(u => {
                const row = [
                  u.id,
                  `"${u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}"`,
                  `"${u.email || ''}"`,
                  `"${u.phone || ''}"`,
                  u.role || '',
                  u.status || '',
                  u.country || '',
                  u.createdAt || ''
                ];
                csvRows.push(row.join(','));
              });
              const csvContent = csvRows.join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
              toast.success('Users exported successfully');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => { setAddUserOpen(true); setError(null); setSuccess(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: '24,521', change: '+15.3%' },
          { label: 'Active Users', value: '21,845', change: '+12.1%' },
          { label: 'New This Month', value: '1,284', change: '+8.5%' },
          { label: 'Avg. Order Value', value: '₹42,500', change: '+5.2%' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className="text-sm text-green-600 font-medium">{stat.change}</span>
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {currentUserRole === 'super_admin' && (
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                aria-label="Filter by country"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            {currentUserRole === 'country_admin' && adminCountry && (
              <span className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" title="Country Admin scope">
                Country: {adminCountry}
              </span>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
            <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
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
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Total Spent</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Country</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">KYC</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
                        <span className="text-gold-600 font-semibold">
                          {(user.name || user.firstName || '?').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name || `${user.firstName} ${user.lastName}`}</p>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-4 h-4" />
                        {user.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.orders ?? '–'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₹{(user.spent ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleBadgeColors[user.role ?? 'customer'] ?? 'bg-gray-100 text-gray-700'}`}>
                      {user.role ?? 'customer'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.country ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      statusColors[user.status as keyof typeof statusColors] ?? 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.joined ?? (user.createdAt ? formatRelativeDate(user.createdAt) : '—')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.kycStatus === 'verified' || user.kycStatus === 'approved' ? (
                      <span className="text-green-600" title="KYC Verified">✓ Verified</span>
                    ) : user.kycStatus ? (
                      <span className="text-amber-600" title="KYC Pending">⏳ {user.kycStatus}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {currentUserRole === 'super_admin' && user.role !== 'super_admin' && (
                        <button
                          type="button"
                          disabled={!!roleActioning}
                          onClick={() => {
                            const country = window.prompt('Assign as Country Admin. Enter country (IN, AE, UK):');
                            if (!country || !COUNTRIES.includes(country as typeof COUNTRIES[number])) return;
                            setRoleActioning(user.id);
                            setError(null);
                            adminApi.setUserRole(user.id, 'country_admin', country)
                              .then(() => { toast.success('Role updated'); setSuccess('Role updated'); setPage(1); })
                              .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Failed to update role'))
                              .finally(() => setRoleActioning(null));
                          }}
                          className="text-xs px-2 py-1 rounded bg-gold-100 text-gold-800 hover:bg-gold-200 disabled:opacity-50"
                        >
                          {roleActioning === user.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Set country admin'}
                        </button>
                      )}
                      <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      <div className="relative">
                        <button 
                          type="button" 
                          className="p-2 hover:bg-gray-100 rounded-lg" 
                          title="More"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === user.id ? null : user.id);
                          }}
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                        {dropdownOpen === user.id && (
                          <div 
                            className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setDropdownOpen(null);
                                setSelectedUser(user);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit User
                            </button>
                            {(currentUserRole === 'super_admin' || (currentUserRole === 'country_admin' && user.country === adminCountry && user.role !== 'super_admin' && user.role !== 'country_admin')) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
                                  setDropdownOpen(null);
                                  try {
                                    await adminApi.deleteUser(user.id);
                                    toast.success('User deleted successfully');
                                    setRefreshKey(k => k + 1);
                                  } catch (err) {
                                    toast.error(err instanceof ApiError ? err.message : 'Failed to delete user');
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
            {loading ? 'Loading...' : `Showing ${filteredUsers.length} of ${total} users`}
          </p>
          {(() => {
            const limit = 20;
            const totalPages = Math.max(1, Math.ceil(total / limit));
            return totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-lg ${
                        page === pageNum 
                          ? 'bg-gold-500 text-white' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  type="button" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal
            key="user-detail-modal"
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            currentUserRole={currentUserRole ?? undefined}
            currentUserCountry={adminCountry ?? undefined}
            onRoleChange={async (userId, role, country) => {
              await adminApi.setUserRole(userId, role, country);
              toast.success('Role updated');
              setRefreshKey(k => k + 1); // refresh list
            }}
            onUpdate={async (userId, data) => {
              await adminApi.updateUser(userId, data);
              toast.success('User details updated');
              setRefreshKey(k => k + 1); // refresh list
              setSelectedUser(null);
            }}
            onDelete={async (userId) => {
              await adminApi.deleteUser(userId);
              toast.success('User deleted successfully');
              setRefreshKey(k => k + 1); // refresh list
              setSelectedUser(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {addUserOpen && (
          <AddUserModal
            key="add-user-modal"
            onClose={() => setAddUserOpen(false)}
            adminRole={currentUserRole}
            adminCountry={adminCountry}
            onSubmit={async (data) => {
              setSubmitting(true);
              setError(null);
              setSuccess(null);
              try {
                // For country admins, force their country
                const userCountry = currentUserRole === 'country_admin' && adminCountry 
                  ? adminCountry 
                  : data.country;
                
                const res = await authApi.register({
                  email: data.email,
                  password: data.password,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  phone: data.phone,
                  country: userCountry as 'IN' | 'AE' | 'UK',
                  acceptedTerms: true,
                }) as { data?: { userId?: string; user?: { id?: string } }; userId?: string };
                const userId = res?.data?.userId ?? res?.data?.user?.id ?? (res as { userId?: string }).userId;
                
                // Only super_admin can set roles other than customer
                if (currentUserRole === 'super_admin' && data.role && data.role !== 'customer' && userId) {
                  await adminApi.setUserRole(userId, data.role, userCountry);
                }
                setSuccess('User created successfully. They will receive a verification email.');
                setTimeout(() => { 
                  setAddUserOpen(false); 
                  setSuccess(null);
                  setRefreshKey((k) => k + 1); // Trigger user list refresh
                }, 2000);
              } catch (err) {
                let errorMsg = 'Failed to create user';
                if (err instanceof ApiError) {
                  errorMsg = err.message;
                  // Extract specific validation error message if available
                  const details = err.details as { errors?: Array<{ message?: string; path?: string[] }> } | undefined;
                  if (details?.errors?.length) {
                    const firstError = details.errors[0];
                    errorMsg = firstError.message || err.message;
                  }
                }
                setError(errorMsg);
              } finally {
                setSubmitting(false);
              }
            }}
            submitting={submitting}
            success={success}
            error={error}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Roles available for super_admin to assign
const SUPER_ADMIN_ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'seller', label: 'Seller' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'country_admin', label: 'Country Admin' },
] as const;

// Roles available for country_admin to assign (limited)
const COUNTRY_ADMIN_ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'seller', label: 'Seller' },
  { value: 'influencer', label: 'Influencer' },
] as const;

function AddUserModal({
  onClose,
  onSubmit,
  adminRole,
  adminCountry,
  submitting,
  success,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: { email: string; password: string; firstName: string; lastName: string; phone: string; country: string; role: string }) => Promise<void>;
  adminRole: string | null;
  adminCountry: string | null;
  submitting: boolean;
  success: string | null;
  error: string | null;
}) {
  // For country admins, lock the country to their assigned country
  const isCountryAdmin = adminRole === 'country_admin';
  const lockedCountry = isCountryAdmin && adminCountry ? adminCountry : null;
  const availableRoles = adminRole === 'super_admin' ? SUPER_ADMIN_ROLES : COUNTRY_ADMIN_ROLES;
  
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '', 
    phone: '', 
    country: lockedCountry || 'IN', 
    role: 'customer' 
  });

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
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add User</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
          className="p-6 space-y-4"
        >
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              aria-label="Select user role"
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {isCountryAdmin 
                ? 'You can only create customers, sellers, and influencers in your country.' 
                : 'Assign role for this user. Customer is default.'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <p className="text-xs text-gray-500 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={lockedCountry || form.country}
              onChange={(e) => !lockedCountry && setForm((f) => ({ ...f, country: e.target.value }))}
              disabled={!!lockedCountry}
              className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                lockedCountry ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="IN">India</option>
              <option value="AE">UAE</option>
              <option value="UK">UK</option>
            </select>
            {lockedCountry && (
              <p className="text-xs text-gray-500 mt-1">Country is locked to your assigned country.</p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
