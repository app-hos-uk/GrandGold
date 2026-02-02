import type { Country, Currency, Money } from '@grandgold/types';
/**
 * Format currency amount
 */
export declare function formatCurrency(amount: number, currency: Currency): string;
/**
 * Format money object
 */
export declare function formatMoney(money: Money): string;
/**
 * Format number with commas
 */
export declare function formatNumber(num: number, locale?: string): string;
/**
 * Format weight in grams
 */
export declare function formatWeight(grams: number): string;
/**
 * Format date
 */
export declare function formatDate(date: Date | string, country?: Country, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format date and time
 */
export declare function formatDateTime(date: Date | string, country?: Country, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format relative time (e.g., "2 hours ago")
 */
export declare function formatRelativeTime(date: Date | string): string;
/**
 * Format phone number
 */
export declare function formatPhoneNumber(phone: string, country: Country): string;
/**
 * Format order number
 */
export declare function formatOrderNumber(orderId: string, country: Country): string;
/**
 * Format percentage
 */
export declare function formatPercentage(value: number, decimals?: number): string;
/**
 * Format file size
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Truncate text with ellipsis
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Format name (capitalize first letter)
 */
export declare function formatName(name: string): string;
/**
 * Format slug
 */
export declare function toSlug(text: string): string;
//# sourceMappingURL=formatters.d.ts.map