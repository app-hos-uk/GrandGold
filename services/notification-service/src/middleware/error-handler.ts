import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const status = (err as { status?: number }).status ?? 500;
  const message = err.message || 'Internal server error';
  const code = (err as { code?: string }).code;
  res.status(status).json({ success: false, error: { message, code } });
}
