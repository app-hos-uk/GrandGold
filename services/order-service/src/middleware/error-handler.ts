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
  const logMeta: Record<string, unknown> = {
    path: req.path,
    method: req.method,
    errorMessage: err.message,
    errorName: err.name,
  };
  if (err instanceof AppError && err.details) {
    logMeta.details = err.details;
  }
  if (isOperationalError(err)) {
    logger.warn(logMeta, 'Operational error');
  } else {
    logger.error(logMeta, 'Unexpected error');
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const response = formatErrorResponse(err);
  
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
