/**
 * API client for GrandGold backend services
 * Uses relative URLs - Next.js rewrites proxy to appropriate services
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

const AUTH_TOKEN_KEY = 'grandgold_token';
const AUTH_REFRESH_KEY = 'grandgold_refresh';

/** Get auth token - from localStorage (set after login) or cookie */
const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('accessToken');
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token refresh state to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
  if (!refreshToken) return false;
  
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        return false;
      }
      
      const data = await res.json();
      const tokens = data?.data?.tokens || data?.tokens;
      if (tokens?.accessToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem('accessToken', tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem(AUTH_REFRESH_KEY, tokens.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

async function handleResponse<T>(res: Response, retryFn?: () => Promise<Response>): Promise<T> {
  // If 401 and we have a retry function, try to refresh token and retry
  if (res.status === 401 && retryFn) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryRes = await retryFn();
      return handleResponse<T>(retryRes); // Don't pass retryFn to avoid infinite loop
    }
  }
  
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    const message = data?.error?.message || data?.message || res.statusText;
    throw new ApiError(
      message,
      res.status,
      data?.error?.code,
      data?.error?.details ?? data?.errors
    );
  }
  
  return data.data ?? data;
}

export const api = {
  async patch<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const doFetch = () => fetch(`${getBaseUrl()}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers as Record<string, string>),
      },
      body: JSON.stringify(body),
      credentials: 'include',
      ...options,
    });
    const res = await doFetch();
    return handleResponse<T>(res, doFetch);
  },

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    const doFetch = () => fetch(`${getBaseUrl()}${path}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
      ...options,
    });
    const res = await doFetch();
    return handleResponse<T>(res, doFetch);
  },

  async post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const doFetch = () => fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers as Record<string, string>),
      },
      body: JSON.stringify(body),
      credentials: 'include',
      ...options,
    });
    const res = await doFetch();
    return handleResponse<T>(res, doFetch);
  },

  async put<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const doFetch = () => fetch(`${getBaseUrl()}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers as Record<string, string>),
      },
      body: JSON.stringify(body),
      credentials: 'include',
      ...options,
    });
    const res = await doFetch();
    return handleResponse<T>(res, doFetch);
  },

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const doFetch = () => fetch(`${getBaseUrl()}${path}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
      ...options,
    });
    const res = await doFetch();
    return handleResponse<T>(res, doFetch);
  },

  async postFormData<T>(path: string, formData: FormData, options?: RequestInit): Promise<T> {
    const doFetch = () => fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
      credentials: 'include',
      ...options,
    });
    const res = await doFetch();
    return handleResponse<T>(res, doFetch);
  },
};

// Cart API
export const cartApi = {
  getSession: () => api.get<{ cartId: string; isLoggedIn: boolean }>('/api/cart/session'),
  get: (cartId?: string) =>
    api.get<{
      id: string;
      items: Array<{
        productId: string;
        name: string;
        image: string;
        price: number;
        quantity: number;
        purity?: string;
      }>;
      subtotal: number;
      itemCount: number;
      currency: string;
      country: string;
    }>(cartId ? `/api/cart?cartId=${cartId}` : '/api/cart'),
  addItem: (data: { productId: string; quantity?: number; cartId?: string; country: string }) =>
    api.post<unknown>('/api/cart/items', data),
  updateQuantity: (productId: string, quantity: number, cartId?: string) => {
    const url = `/api/cart/items/${productId}${cartId ? `?cartId=${cartId}` : ''}`;
    return api.patch<unknown>(url, { quantity });
  },
  removeItem: (productId: string, cartId?: string) => {
    const url = `/api/cart/items/${productId}${cartId ? `?cartId=${cartId}` : ''}`;
    return api.delete<unknown>(url);
  },
  getCount: (cartId?: string) =>
    api.get<{ count: number }>(cartId ? `/api/cart/count?cartId=${cartId}` : '/api/cart/count'),
  saveForLater: (productIds: string[], cartId?: string) =>
    api.post<{ cart: unknown; movedProductIds: string[] }>('/api/cart/save-for-later', {
      productIds,
      cartId,
    }),
};

// Wishlist API
export const wishlistApi = {
  get: () => api.get<{ items: Array<{ productId: string }>; products?: unknown[] }>('/api/wishlist'),
  add: (productId: string, country: string) =>
    api.post<{ added: boolean; count: number }>('/api/wishlist', { productId, country }),
  remove: (productId: string, country: string) =>
    api.delete<unknown>(`/api/wishlist/${productId}?country=${country}`),
  getCount: (country: string) =>
    api.get<{ count: number }>(`/api/wishlist/count?country=${country}`),
};

// Notifications API
export const notificationsApi = {
  getList: () =>
    api.get<{ items: Array<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string; link?: string }>; unreadCount: number }>(
      '/api/notifications'
    ),
  markRead: (id: string) => api.patch<unknown>(`/api/notifications/${id}/read`, {}),
  markAllRead: () => api.post<unknown>('/api/notifications/mark-all-read', {}),
};

// User preferences (notification settings)
export const userApi = {
  getPreferences: () => api.get<{ language: string; currency: string; notifications: Record<string, unknown> }>('/api/user/preferences'),
  updateNotificationPreferences: (notifications: Record<string, unknown>) =>
    api.patch<unknown>('/api/user/preferences', { notifications }),
};

// Influencer (storefront + admin)
export interface InfluencerRack {
  slug: string;
  name: string;
  bio: string;
  productIds?: string[];
  commissionRate?: number;
  products?: unknown[];
}

export const influencerApi = {
  getRack: (slug: string) =>
    api.get<{ data: { rack: { slug: string; name: string; bio: string; products: unknown[] } } }>(`/api/influencers/${slug}/rack`),
  getCommission: (slug: string) =>
    api.get<{ data: { total: number; pending: number; paid: number; orders: number } }>(`/api/influencers/${slug}/commission`),
  /** List all influencer racks (admin) */
  listRacks: (): Promise<InfluencerRack[]> =>
    api.get<{ data: { racks: InfluencerRack[] } }>('/api/influencers').then((d) => d?.data?.racks ?? []),
  /** Create influencer rack (admin) */
  createRack: (body: { slug: string; name: string; bio?: string; productIds?: string[]; commissionRate?: number }): Promise<InfluencerRack> =>
    api.post<{ data: { rack: InfluencerRack } }>('/api/influencers', body).then((d) => d?.data?.rack),
  /** Update influencer rack (admin) */
  updateRack: (slug: string, body: { name?: string; bio?: string; productIds?: string[]; commissionRate?: number }): Promise<InfluencerRack> =>
    api.put<{ data: { rack: InfluencerRack } }>(`/api/influencers/${slug}`, body).then((d) => d?.data?.rack),
};

// Click & Collect
export const clickCollectApi = {
  getStores: (country: string) =>
    api.get<{ data: Array<{ id: string; name: string; address: string; phone: string; hours: string; lat?: number; lng?: number; available?: boolean }> }>(`/api/click-collect/stores?country=${country}`),
};

// Push subscription (proxied to order-service)
export const pushApi = {
  subscribe: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    api.post<unknown>('/api/push/subscribe', subscription),
};

// Current user profile (role, country for admin checks)
export interface CurrentUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  country: string;
  kycStatus?: string;
  kycTier?: number;
  preferences?: Record<string, unknown>;
  addresses?: unknown[];
}

// Admin API (requires admin role JWT)
export const adminApi = {
  getMe: (): Promise<CurrentUserProfile> =>
    api.get<CurrentUserProfile>('/api/user/me').then((d: unknown) => (d as { data?: CurrentUserProfile }).data ?? (d as CurrentUserProfile)),
  setUserRole: (userId: string, role: string, country?: string) =>
    api.patch<unknown>(`/api/user/admin/${userId}/role`, { role, country }),
  updateUser: (userId: string, data: { firstName?: string; lastName?: string; phone?: string }) =>
    api.patch<unknown>(`/api/user/admin/${userId}`, data),
  deleteUser: (userId: string) =>
    api.delete<unknown>(`/api/user/admin/${userId}`),
  getProducts: (params?: { page?: number; limit?: number; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);
    return api.get<{ data: unknown[]; total: number }>(`/api/search/admin?${q.toString()}`);
  },
  createProduct: (data: {
    name: string;
    sku?: string;
    slug: string;
    category: string;
    description?: string;
    basePrice: number;
    currency: string;
    pricingModel: 'fixed' | 'live_rate';
    goldWeight?: number;
    purity?: string;
    metalType?: string;
    stockQuantity?: number;
    tags?: string[];
    countries: string[];
  }) => api.post<{ data: { id: string } }>('/api/products', data),
  updateProduct: (id: string, data: Partial<{
    name: string;
    sku: string;
    slug: string;
    category: string;
    description: string;
    basePrice: number;
    currency: string;
    pricingModel: 'fixed' | 'live_rate';
    goldWeight: number;
    purity: string;
    metalType: string;
    stockQuantity: number;
    tags: string[];
    countries: string[];
    isActive: boolean;
  }>) => api.patch<{ data: { id: string } }>(`/api/products/${id}`, data),
  deleteProduct: (id: string) => api.delete<void>(`/api/products/${id}`),
  getOrders: (params?: { page?: number; limit?: number; country?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.country) q.set('country', params.country);
    if (params?.status) q.set('status', params.status);
    return api.get<{ data: unknown[]; total: number }>(`/api/orders/admin/all?${q.toString()}`);
  },
  updateOrderStatus: (orderId: string, status: string, note?: string) =>
    api.patch<unknown>(`/api/orders/admin/${orderId}/status`, { status, note }),
  getUsers: (params?: { page?: number; limit?: number; country?: string; role?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.country) q.set('country', params.country);
    if (params?.role) q.set('role', params.role);
    if (params?.search) q.set('search', params.search);
    return api.get<{ users: unknown[]; total: number }>(`/api/user/admin/list?${q.toString()}`);
  },
  // KYC (admin)
  getKycPending: (params?: { page?: number; limit?: number; country?: string; tier?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.country) q.set('country', params.country);
    if (params?.tier) q.set('tier', params.tier);
    return api.get<{ applications: unknown[]; total: number }>(`/api/kyc/pending?${q.toString()}`);
  },
  approveKyc: (userId: string, tier: number, notes?: string) =>
    api.post<unknown>(`/api/kyc/${userId}/approve`, { tier, notes }),
  rejectKyc: (userId: string, tier: number, reason: string) =>
    api.post<unknown>(`/api/kyc/${userId}/reject`, { tier, reason }),
  // Refunds (admin)
  getRefundsPending: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({ admin: '1' });
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api.get<{ data: unknown[]; total: number }>(`/api/payments/refunds?${q.toString()}`);
  },
  approveRefund: (refundId: string, body?: { partialAmount?: number; internalNotes?: string }) =>
    api.post<unknown>(`/api/payments/refunds/${refundId}/approve`, body ?? {}),
  rejectRefund: (refundId: string, reason: string) =>
    api.post<unknown>(`/api/payments/refunds/${refundId}/reject`, { reason }),
  // Seller onboarding (admin)
  getOnboardingPending: (params?: { page?: number; limit?: number; country?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.country) q.set('country', params.country);
    return api.get<{ data: unknown[]; total: number }>(`/api/sellers/onboarding/pending?${q.toString()}`);
  },
  approveOnboarding: (onboardingId: string) =>
    api.post<unknown>(`/api/sellers/onboarding/${onboardingId}/approve`, {}),
  rejectOnboarding: (onboardingId: string, reason: string) =>
    api.post<unknown>(`/api/sellers/onboarding/${onboardingId}/reject`, { reason }),
  // Seller invitation
  inviteSeller: (data: { 
    email: string; 
    firstName: string; 
    lastName: string; 
    phone: string; 
    businessName: string; 
    country: string; 
    tempPassword?: string;
  }) => api.post<{ data: { id: string; email: string; onboardingUrl: string }; message: string }>('/api/admin/invite-seller', data),
  // Influencer invitation
  inviteInfluencer: (data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country: string;
    socialHandles?: { instagram?: string; youtube?: string; tiktok?: string };
    tempPassword?: string;
  }) => api.post<{ data: { id: string; email: string }; message: string }>('/api/admin/invite-influencer', data),
  // Roles CRUD
  getRoles: (params?: { country?: string }) => {
    const q = new URLSearchParams();
    if (params?.country) q.set('country', params.country);
    return api.get<{ roles: RoleData[] }>(`/api/roles?${q.toString()}`);
  },
  getRole: (roleId: string) => api.get<{ role: RoleData }>(`/api/roles/${roleId}`),
  createRole: (data: { name: string; description?: string; scope: 'global' | 'country'; country?: string; permissions: string[] }) =>
    api.post<{ role: RoleData }>('/api/roles', data),
  updateRole: (roleId: string, data: { name?: string; description?: string; scope?: 'global' | 'country'; country?: string; permissions?: string[] }) =>
    api.patch<{ role: RoleData }>(`/api/roles/${roleId}`, data),
  deleteRole: (roleId: string) => api.delete<void>(`/api/roles/${roleId}`),
  // Categories CRUD
  getCategories: (params?: { flat?: boolean; country?: string }) => {
    const q = new URLSearchParams();
    if (params?.flat) q.set('flat', 'true');
    if (params?.country) q.set('country', params.country);
    return api.get<{ data: CategoryData[]; total: number }>(`/api/categories?${q.toString()}`);
  },
  getCategory: (idOrSlug: string) => api.get<{ data: CategoryData & { children?: CategoryData[] } }>(`/api/categories/${idOrSlug}`),
  createCategory: (data: { name: string; slug?: string; description?: string; parentId?: string | null; image?: string; icon?: string; isActive?: boolean; order?: number; metaTitle?: string; metaDescription?: string; countries?: string[] }) =>
    api.post<{ data: CategoryData }>('/api/categories', data),
  updateCategory: (id: string, data: Partial<{ name: string; slug: string; description: string; parentId: string | null; image: string; icon: string; isActive: boolean; order: number; metaTitle: string; metaDescription: string; countries: string[] }>) =>
    api.patch<{ data: CategoryData }>(`/api/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<void>(`/api/categories/${id}`),
  reorderCategories: (items: { id: string; order: number }[]) =>
    api.post<void>('/api/categories/reorder', { items }),
  // Inventory (admin view)
  getInventory: (params?: { page?: number; limit?: number; country?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.country) q.set('country', params.country);
    if (params?.status) q.set('status', params.status);
    return api.get<{ data: InventoryItem[]; total: number }>(`/api/inventory/admin?${q.toString()}`);
  },
  getInventoryAlerts: () => api.get<{ data: InventoryItem[] }>('/api/inventory/alerts'),
  updateInventory: (productId: string, data: { quantity: number; lowStockThreshold?: number }) =>
    api.put<{ data: InventoryItem }>(`/api/inventory/product/${productId}`, data),
  // Analytics (admin dashboard)
  getAnalytics: (params?: { dateRange?: string; country?: string }) => {
    const q = new URLSearchParams();
    if (params?.dateRange) q.set('dateRange', params.dateRange);
    if (params?.country) q.set('country', params.country);
    return api.get<AdminAnalytics>(`/api/admin/analytics?${q.toString()}`);
  },
  // Finance
  getFinanceStats: (params?: { dateRange?: string; country?: string }) => {
    const q = new URLSearchParams();
    if (params?.dateRange) q.set('dateRange', params.dateRange);
    if (params?.country) q.set('country', params.country);
    return api.get<FinanceStats>(`/api/payments/admin/stats?${q.toString()}`);
  },
  getTransactions: (params?: { page?: number; limit?: number; type?: string; status?: string; country?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.type) q.set('type', params.type);
    if (params?.status) q.set('status', params.status);
    if (params?.country) q.set('country', params.country);
    return api.get<{ data: TransactionRecord[]; total: number }>(`/api/payments/admin/transactions?${q.toString()}`);
  },
  getSettlements: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    return api.get<{ data: Settlement[]; total: number }>(`/api/payments/admin/settlements?${q.toString()}`);
  },
  processSettlement: (settlementId: string) =>
    api.post<void>(`/api/payments/admin/settlements/${settlementId}/process`, {}),
  // Audit logs
  getAuditLogs: (params?: { page?: number; limit?: number; category?: string; actor?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.category) q.set('category', params.category);
    if (params?.actor) q.set('actor', params.actor);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    return api.get<{ data: AuditLog[]; total: number }>(`/api/audit-logs?${q.toString()}`);
  },
  // Support tickets
  getTickets: (params?: { page?: number; limit?: number; status?: string; priority?: string; assignee?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.assignee) q.set('assignee', params.assignee);
    return api.get<{ data: SupportTicket[]; total: number; stats?: SupportStats }>(`/api/support/tickets?${q.toString()}`);
  },
  getTicket: (ticketId: string) => api.get<{ data: SupportTicket }>(`/api/support/tickets/${ticketId}`),
  updateTicket: (ticketId: string, data: { status?: string; priority?: string; assigneeId?: string }) =>
    api.patch<{ data: SupportTicket }>(`/api/support/tickets/${ticketId}`, data),
  addTicketReply: (ticketId: string, content: string, isInternal?: boolean) =>
    api.post<void>(`/api/support/tickets/${ticketId}/reply`, { content, isInternal }),
  createTicket: (data: { subject: string; category: string; priority: string; customerEmail?: string; customerName?: string; orderId?: string; description: string }) =>
    api.post<{ data: SupportTicket }>('/api/support/tickets', data),
  // Marketing
  getCampaigns: (params?: { page?: number; limit?: number; status?: string; channel?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.channel) q.set('channel', params.channel);
    return api.get<{ data: Campaign[]; total: number }>(`/api/marketing/campaigns?${q.toString()}`);
  },
  createCampaign: (data: { name: string; channel: string; subject?: string; content: string; segmentId?: string; scheduledAt?: string }) =>
    api.post<{ data: Campaign }>('/api/marketing/campaigns', data),
  getSegments: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api.get<{ data: Segment[]; total: number }>(`/api/marketing/segments?${q.toString()}`);
  },
  createSegment: (data: { name: string; criteria: Record<string, unknown> }) =>
    api.post<{ data: Segment }>('/api/marketing/segments', data),
  // Shipping
  getCarriers: (params?: { country?: string }) => {
    const q = new URLSearchParams();
    if (params?.country) q.set('country', params.country);
    return api.get<{ data: Carrier[] }>(`/api/shipping/carriers?${q.toString()}`);
  },
  updateCarrier: (carrierId: string, data: Partial<Carrier>) =>
    api.patch<{ data: Carrier }>(`/api/shipping/carriers/${carrierId}`, data),
  createCarrier: (data: Omit<Carrier, 'id'>) =>
    api.post<{ data: Carrier }>('/api/shipping/carriers', data),
  updateShippingSettings: (settings: { freeShippingThreshold: number; armoredTransportEnabled: boolean }) =>
    api.put<void>('/api/shipping/settings', settings),
};

// Category data type
export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  image: string | null;
  icon: string | null;
  productCount: number;
  isActive: boolean;
  order: number;
  level: number;
  path: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  countries: string[];
  createdAt: string;
  updatedAt: string;
  children?: CategoryData[];
}

// Inventory item type
export interface InventoryItem {
  id: string;
  productId: string;
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

// Admin analytics type
export interface AdminAnalytics {
  revenue: { total: number; change: number };
  orders: { total: number; change: number };
  customers: { total: number; change: number };
  avgOrderValue: number;
  topProducts: { id: string; name: string; sales: number }[];
  revenueByCountry: { country: string; revenue: number }[];
  recentOrders: { id: string; customer: string; amount: number; status: string; date: string }[];
}

// Finance types
export interface FinanceStats {
  totalRevenue: number;
  revenueChange: number;
  totalTransactions: number;
  transactionsChange: number;
  pendingPayouts: number;
  pendingPayoutsCount: number;
  totalCommission: number;
  commissionChange: number;
  avgTransactionValue: number;
  refundsProcessed: number;
  refundAmount: number;
  platformBalance: number;
}

export interface TransactionRecord {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'commission';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  date: string;
  country: string;
  orderId?: string;
  sellerId?: string;
}

export interface Settlement {
  id: string;
  sellerName: string;
  sellerId: string;
  amount: number;
  ordersCount: number;
  periodStart: string;
  periodEnd: string;
  status: 'ready' | 'processing' | 'completed' | 'on_hold';
}

// Audit log type
export interface AuditLog {
  id: string;
  timestamp: string;
  actor: { id: string; name: string; email: string; role: string };
  action: string;
  category: 'auth' | 'users' | 'orders' | 'products' | 'payments' | 'settings' | 'security';
  resource: { type: string; id: string; name?: string };
  details: string;
  status: 'success' | 'failed' | 'warning';
  ip: string;
  userAgent: string;
  country?: string;
}

// Support types
export interface SupportTicket {
  id: string;
  subject: string;
  customer: { id: string; name: string; email: string };
  type: 'order' | 'return' | 'payment' | 'product' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  channel: 'chat' | 'email' | 'phone' | 'whatsapp';
  assignee?: { id: string; name: string };
  messages?: { id: string; content: string; sender: string; isInternal: boolean; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
  country: string;
}

export interface SupportStats {
  openTickets: number;
  avgResponseTime: number;
  resolutionRate: number;
  activeChats: number;
  waitingCustomers: number;
  aiResolutionRate: number;
  customerSatisfaction: number;
}

// Marketing types
export interface Campaign {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'push' | 'sms';
  status: 'draft' | 'scheduled' | 'sent' | 'sending';
  subject?: string;
  content: string;
  segmentId?: string;
  recipients: number;
  sentAt?: string;
  scheduledAt?: string;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

export interface Segment {
  id: string;
  name: string;
  criteria: Record<string, unknown>;
  count: number;
  lastUpdated: string;
}

// Shipping types
export interface Carrier {
  id: string;
  name: string;
  code: string;
  countries: string[];
  services: { name: string; estimatedDays: string; rateType: 'flat' | 'per_kg'; rate: number }[];
  isActive: boolean;
  supportsTracking: boolean;
  supportsInsurance: boolean;
}

export interface RoleData {
  id: string;
  name: string;
  description: string | null;
  scope: 'global' | 'country';
  country: string | null;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// Auth API
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    country: string;
    mfaEnabled?: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('accessToken');
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem('accessToken', accessToken); // legacy
  if (refreshToken) localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('accessToken');
  localStorage.removeItem(AUTH_REFRESH_KEY);
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<{ user: LoginResponse['user']; tokens: LoginResponse['tokens']; requiresMfa?: boolean; mfaToken?: string }>(
      '/api/auth/login',
      { email: email.trim().toLowerCase(), password }
    );
    if (res.requiresMfa) {
      throw new ApiError('MFA verification required', 200, 'MFA_REQUIRED', { mfaToken: res.mfaToken });
    }
    if (res.user && res.tokens?.accessToken) {
      setStoredTokens(res.tokens.accessToken, res.tokens.refreshToken);
      return { user: res.user, tokens: res.tokens };
    }
    throw new ApiError('Invalid login response', 500);
  },
  getMe: (): Promise<CurrentUserProfile> =>
    api.get<CurrentUserProfile>('/api/user/me').then((d: unknown) => (d as { data?: CurrentUserProfile }).data ?? (d as CurrentUserProfile)),
  logout: (): void => {
    clearStoredAuth();
  },
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: 'IN' | 'AE' | 'UK';
    acceptedTerms: boolean;
    marketingConsent?: boolean;
  }) => api.post<{ user: unknown }>('/api/auth/register', { ...data, acceptedTerms: true }),
};

// Seller onboarding API
export const onboardingApi = {
  start: (data: {
    businessName: string;
    businessType: 'individual' | 'company' | 'partnership';
    registrationNumber?: string;
    taxId?: string;
    email: string;
    phone: string;
    businessAddress: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: 'IN' | 'AE' | 'UK';
    };
    onboardingType: 'automated' | 'manual';
    country: 'IN' | 'AE' | 'UK';
    acceptTerms: boolean;
    acceptCommissionStructure: boolean;
  }) => api.post<{ sellerId: string; onboardingId: string }>('/api/sellers/onboarding/start', data),

  getStatus: () => api.get<{
    id: string;
    status: string;
    currentStep: number;
    totalSteps: number;
    completedSteps: string[];
    pendingSteps: string[];
  }>('/api/sellers/onboarding/status'),

  uploadDocuments: (formData: FormData) =>
    api.postFormData<unknown>('/api/sellers/onboarding/documents', formData),

  submitBankDetails: (data: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchCode?: string;
    swiftCode?: string;
    iban?: string;
  }) => api.post<unknown>('/api/sellers/onboarding/bank-details', data),

  signAgreement: () => api.post<{ signingUrl: string }>('/api/sellers/onboarding/agreement/sign', {}),

  submit: () => api.post<unknown>('/api/sellers/onboarding/submit', {}),
};

// Payment API - Stripe
export const stripeApi = {
  createPaymentIntent: (data: { amount: number; currency: string; metadata?: Record<string, string> }) =>
    api.post<{ clientSecret: string; paymentIntentId: string }>('/api/payments/stripe/create-intent', data),
  createSetupIntent: () =>
    api.post<{ clientSecret: string }>('/api/payments/stripe/create-setup-intent', {}),
  getSavedCards: () =>
    api.get<Array<{ id: string; brand: string; last4: string; expMonth: number; expYear: number }>>('/api/payments/stripe/saved-cards'),
  deleteCard: (cardId: string) =>
    api.delete<unknown>(`/api/payments/stripe/saved-cards/${cardId}`),
  confirmPayment: (data: { paymentIntentId: string; paymentMethodId?: string }) =>
    api.post<{ status: string; paymentId: string }>('/api/payments/stripe/confirm', data),
};

// Payment API - Razorpay
export const razorpayApi = {
  createOrder: (data: { amount: number; currency?: string; receipt: string; notes?: Record<string, string> }) =>
    api.post<{ orderId: string; amount: number; currency: string; keyId: string }>('/api/payments/razorpay/create-order', data),
  verifyPayment: (data: { orderId: string; paymentId: string; signature: string }) =>
    api.post<{ verified: boolean; paymentId: string }>('/api/payments/razorpay/verify', data),
  getPayment: (paymentId: string) =>
    api.get<{ id: string; status: string; amount: number }>(`/api/payments/razorpay/payment/${paymentId}`),
  getBanks: () =>
    api.get<Array<{ code: string; name: string }>>('/api/payments/razorpay/banks'),
};

// Checkout API
export const checkoutApi = {
  createOrder: (data: {
    cartId: string;
    shippingAddress: {
      firstName: string;
      lastName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    billingAddress?: {
      firstName: string;
      lastName: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    paymentMethod: 'stripe' | 'razorpay' | 'cod';
    deliveryOption?: 'standard' | 'express' | 'click_collect';
  }) => api.post<{ orderId: string; paymentRequired: boolean }>('/api/checkout/create', data),
  
  completeOrder: (orderId: string, paymentDetails: { paymentId: string; provider: string }) =>
    api.post<{ order: unknown }>(`/api/checkout/${orderId}/complete`, paymentDetails),
};
