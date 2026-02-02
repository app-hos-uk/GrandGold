import { nanoid } from 'nanoid';
/**
 * Generate unique ID
 */
export function generateId(prefix) {
    const id = nanoid();
    return prefix ? `${prefix}_${id}` : id;
}
/**
 * Generate short ID (for order numbers, etc.)
 */
export function generateShortId() {
    return nanoid(10).toUpperCase();
}
/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Retry a function with exponential backoff
 */
export async function retry(fn, options = {}) {
    const { maxRetries = 3, initialDelay = 1000, maxDelay = 30000, factor = 2 } = options;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                break;
            }
            await sleep(delay);
            delay = Math.min(delay * factor, maxDelay);
        }
    }
    throw lastError;
}
/**
 * Deep clone an object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Pick specific keys from an object
 */
export function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}
/**
 * Omit specific keys from an object
 */
export function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
/**
 * Check if object is empty
 */
export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}
/**
 * Remove null and undefined values from object
 */
export function removeEmpty(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Group array by key
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}
/**
 * Calculate distance between two geo coordinates (in km)
 */
export function calculateDistance(from, to) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(from.latitude)) *
            Math.cos(toRad(to.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}
/**
 * Check if coordinates are within country bounds
 */
export function isInCountry(location, country) {
    const bounds = {
        IN: { minLat: 6.5, maxLat: 35.5, minLon: 68.0, maxLon: 97.5 },
        AE: { minLat: 22.5, maxLat: 26.5, minLon: 51.0, maxLon: 56.5 },
        UK: { minLat: 49.5, maxLat: 61.0, minLon: -8.5, maxLon: 2.0 },
    };
    const bound = bounds[country];
    return (location.latitude >= bound.minLat &&
        location.latitude <= bound.maxLat &&
        location.longitude >= bound.minLon &&
        location.longitude <= bound.maxLon);
}
/**
 * Debounce a function
 */
export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
/**
 * Throttle a function
 */
export function throttle(fn, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
/**
 * Chunk array into smaller arrays
 */
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * Unique array values
 */
export function unique(array) {
    return [...new Set(array)];
}
/**
 * Safely parse JSON
 */
export function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=helpers.js.map