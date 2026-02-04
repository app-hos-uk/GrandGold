import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse, isOperationalError } from '@grandgold/utils';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error (include stack for 500s so GCP logs show root cause)
  if (isOperationalError(err)) {
    logger.warn({ err, path: req.path }, 'Operational error');
  } else {
    logger.error(
      {
        path: req.path,
        method: req.method,
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      'Unexpected error'
    );
  }

  // Determine status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Send error response
  const response = formatErrorResponse(err);
  
  // In production, hide internal error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
    return;
  }

  res.status(statusCode).json(response);
}
