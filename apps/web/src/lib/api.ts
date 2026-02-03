/**
 * API client for GrandGold backend services
 * Uses relative URLs - Next.js rewrites proxy to appropriate services
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

/** Get auth token - from localStorage (set after login) or cookie */
const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken');
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

async function handleResponse<T>(res: Response): Promise<T> {
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
    const res = await fetch(`${getBaseUrl()}${path}`, {
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
    return handleResponse<T>(res);
  },

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
      ...options,
    });
    return handleResponse<T>(res);
  },

  async post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
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
    return handleResponse<T>(res);
  },

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
      ...options,
    });
    return handleResponse<T>(res);
  },

  async postFormData<T>(path: string, formData: FormData, options?: RequestInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
      credentials: 'include',
      ...options,
    });
    return handleResponse<T>(res);
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

// Influencer
export const influencerApi = {
  getRack: (slug: string) =>
    api.get<{ data: { rack: { slug: string; name: string; bio: string; products: unknown[] } } }>(`/api/influencers/${slug}/rack`),
  getCommission: (slug: string) =>
    api.get<{ data: { total: number; pending: number; paid: number; orders: number } }>(`/api/influencers/${slug}/commission`),
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
  getProducts: (params?: { page?: number; limit?: number; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);
    return api.get<{ data: unknown[]; total: number }>(`/api/search/admin?${q.toString()}`);
  },
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
  approveRefund: (refundId: string) => api.post<unknown>(`/api/payments/refunds/${refundId}/approve`, {}),
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
};

// Auth API
export const authApi = {
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
