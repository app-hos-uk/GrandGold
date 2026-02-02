/**
 * Base application error
 */
export class AppError extends Error {
    code;
    statusCode;
    isOperational;
    details;
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, isOperational = true, details) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Validation error
 */
export class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', 400, true, details);
        this.name = 'ValidationError';
    }
}
/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 'AUTHENTICATION_ERROR', 401, true);
        this.name = 'AuthenticationError';
    }
}
/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 'AUTHORIZATION_ERROR', 403, true);
        this.name = 'AuthorizationError';
    }
}
/**
 * Not found error
 */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 'NOT_FOUND', 404, true);
        this.name = 'NotFoundError';
    }
}
/**
 * Conflict error
 */
export class ConflictError extends AppError {
    constructor(message) {
        super(message, 'CONFLICT', 409, true);
        this.name = 'ConflictError';
    }
}
/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 'RATE_LIMIT_EXCEEDED', 429, true);
        this.name = 'RateLimitError';
    }
}
/**
 * Payment error
 */
export class PaymentError extends AppError {
    constructor(message, details) {
        super(message, 'PAYMENT_ERROR', 402, true, details);
        this.name = 'PaymentError';
    }
}
/**
 * External service error
 */
export class ExternalServiceError extends AppError {
    constructor(service, message) {
        super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, true);
        this.name = 'ExternalServiceError';
    }
}
/**
 * KYC error
 */
export class KycError extends AppError {
    constructor(message, details) {
        super(message, 'KYC_ERROR', 403, true, details);
        this.name = 'KycError';
    }
}
/**
 * Price lock error
 */
export class PriceLockError extends AppError {
    constructor(message = 'Price lock expired') {
        super(message, 'PRICE_LOCK_ERROR', 409, true);
        this.name = 'PriceLockError';
    }
}
/**
 * Country restriction error
 */
export class CountryRestrictionError extends AppError {
    constructor(message = 'This action is not available in your country') {
        super(message, 'COUNTRY_RESTRICTION', 403, true);
        this.name = 'CountryRestrictionError';
    }
}
/**
 * Check if error is operational (expected)
 */
export function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
/**
 * Format error for API response
 */
export function formatErrorResponse(error) {
    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
            },
        };
    }
    // Generic error
    return {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
    };
}
/**
 * Wrap async handlers for express
 */
export function asyncHandler(fn) {
    return async (...args) => {
        try {
            await fn(...args);
        }
        catch (error) {
            // Let the error propagate to the error middleware
            const next = args[2];
            if (typeof next === 'function') {
                next(error);
            }
        }
    };
}
//# sourceMappingURL=errors.js.map