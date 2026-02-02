/**
 * Base application error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
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
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404, true);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409, true);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true);
    this.name = 'RateLimitError';
  }
}

/**
 * Payment error
 */
export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', 402, true, details);
    this.name = 'PaymentError';
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, true);
    this.name = 'ExternalServiceError';
  }
}

/**
 * KYC error
 */
export class KycError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'KYC_ERROR', 403, true, details);
    this.name = 'KycError';
  }
}

/**
 * Price lock error
 */
export class PriceLockError extends AppError {
  constructor(message: string = 'Price lock expired') {
    super(message, 'PRICE_LOCK_ERROR', 409, true);
    this.name = 'PriceLockError';
  }
}

/**
 * Country restriction error
 */
export class CountryRestrictionError extends AppError {
  constructor(message: string = 'This action is not available in your country') {
    super(message, 'COUNTRY_RESTRICTION', 403, true);
    this.name = 'CountryRestrictionError';
  }
}

/**
 * Check if error is operational (expected)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: Error): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
} {
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
export function asyncHandler<T>(
  fn: (...args: unknown[]) => Promise<T>
): (...args: unknown[]) => Promise<void> {
  return async (...args: unknown[]): Promise<void> => {
    try {
      await fn(...args);
    } catch (error) {
      // Let the error propagate to the error middleware
      const next = args[2] as (error: unknown) => void;
      if (typeof next === 'function') {
        next(error);
      }
    }
  };
}
