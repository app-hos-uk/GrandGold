/**
 * Base application error
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly details?: Record<string, unknown>;
    constructor(message: string, code?: string, statusCode?: number, isOperational?: boolean, details?: Record<string, unknown>);
}
/**
 * Validation error
 */
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Authentication error
 */
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
/**
 * Authorization error
 */
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
/**
 * Not found error
 */
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
/**
 * Conflict error
 */
export declare class ConflictError extends AppError {
    constructor(message: string);
}
/**
 * Rate limit error
 */
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
/**
 * Payment error
 */
export declare class PaymentError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * External service error
 */
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string);
}
/**
 * KYC error
 */
export declare class KycError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Price lock error
 */
export declare class PriceLockError extends AppError {
    constructor(message?: string);
}
/**
 * Country restriction error
 */
export declare class CountryRestrictionError extends AppError {
    constructor(message?: string);
}
/**
 * Check if error is operational (expected)
 */
export declare function isOperationalError(error: Error): boolean;
/**
 * Format error for API response
 */
export declare function formatErrorResponse(error: Error): {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
};
/**
 * Wrap async handlers for express
 */
export declare function asyncHandler<T>(fn: (...args: unknown[]) => Promise<T>): (...args: unknown[]) => Promise<void>;
//# sourceMappingURL=errors.d.ts.map