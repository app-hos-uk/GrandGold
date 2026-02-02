import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError } from '@grandgold/utils';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        message: err.message,
        ...err.details,
      },
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        message: err.message,
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
    },
  });
};
