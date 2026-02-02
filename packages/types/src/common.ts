// Common types used across the application

export type Country = 'IN' | 'AE' | 'UK';

export type Currency = 'INR' | 'AED' | 'GBP' | 'USD';

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDelete {
  deletedAt?: Date | null;
  isDeleted: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: Country;
  location?: GeoLocation;
  isDefault: boolean;
  label?: 'home' | 'work' | 'other';
}

export interface Money {
  amount: number;
  currency: Currency;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FileUpload {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  bucket: string;
  path: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

export interface FilterOptions {
  [key: string]: unknown;
}

export interface QueryOptions {
  pagination?: { page: number; limit: number };
  sort?: SortOptions;
  filters?: FilterOptions;
}
