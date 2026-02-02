import type { Country, Currency, Money } from '@grandgold/types';
import { COUNTRY_CONFIGS } from '@grandgold/types';

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const localeMap: Record<Currency, string> = {
    INR: 'en-IN',
    AED: 'en-AE',
    GBP: 'en-GB',
    USD: 'en-US',
  };
  
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format money object
 */
export function formatMoney(money: Money): string {
  return formatCurrency(money.amount, money.currency);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format weight in grams
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${grams.toFixed(2)} g`;
}

/**
 * Format date
 */
export function formatDate(
  date: Date | string,
  country: Country = 'UK',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const config = COUNTRY_CONFIGS[country];
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString(config.locale, { ...defaultOptions, ...options });
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  country: Country = 'UK',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const config = COUNTRY_CONFIGS[country];
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return dateObj.toLocaleString(config.locale, { ...defaultOptions, ...options });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];
  
  for (const [seconds, unit] of intervals) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string, country: Country): string {
  const config = COUNTRY_CONFIGS[country];
  const cleaned = phone.replace(/\D/g, '');
  
  switch (country) {
    case 'IN':
      if (cleaned.length === 10) {
        return `${config.phoneCode} ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
      }
      break;
    case 'AE':
      if (cleaned.length === 9) {
        return `${config.phoneCode} ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
      }
      break;
    case 'UK':
      if (cleaned.length === 10) {
        return `${config.phoneCode} ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      }
      break;
  }
  
  return phone;
}

/**
 * Format order number
 */
export function formatOrderNumber(orderId: string, country: Country): string {
  const prefix = country === 'IN' ? 'GG-IN' : country === 'AE' ? 'GG-AE' : 'GG-UK';
  return `${prefix}-${orderId.slice(0, 8).toUpperCase()}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format name (capitalize first letter)
 */
export function formatName(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format slug
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}
