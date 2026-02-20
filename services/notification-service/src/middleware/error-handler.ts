import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const status = (err as { status?: number }).status ?? 500;
  const code = (err as { code?: string }).code;
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  if (status >= 500) {
    console.error(`[${req.method}] ${req.path}:`, err.message);
  }
  res.status(status).json({ success: false, error: { message, code } });
}
