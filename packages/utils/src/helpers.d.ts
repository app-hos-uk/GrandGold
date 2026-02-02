import type { Country, GeoLocation } from '@grandgold/types';
/**
 * Generate unique ID
 */
export declare function generateId(prefix?: string): string;
/**
 * Generate short ID (for order numbers, etc.)
 */
export declare function generateShortId(): string;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry a function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
}): Promise<T>;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Pick specific keys from an object
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omit specific keys from an object
 */
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Check if object is empty
 */
export declare function isEmpty(obj: object): boolean;
/**
 * Remove null and undefined values from object
 */
export declare function removeEmpty<T extends object>(obj: T): Partial<T>;
/**
 * Group array by key
 */
export declare function groupBy<T>(array: T[], key: keyof T): Record<string, T[]>;
/**
 * Calculate distance between two geo coordinates (in km)
 */
export declare function calculateDistance(from: GeoLocation, to: GeoLocation): number;
/**
 * Check if coordinates are within country bounds
 */
export declare function isInCountry(location: GeoLocation, country: Country): boolean;
/**
 * Debounce a function
 */
export declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle a function
 */
export declare function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Chunk array into smaller arrays
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * Unique array values
 */
export declare function unique<T>(array: T[]): T[];
/**
 * Safely parse JSON
 */
export declare function safeJsonParse<T>(json: string, fallback: T): T;
//# sourceMappingURL=helpers.d.ts.map