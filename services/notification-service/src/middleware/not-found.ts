import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: { message: 'Not found', code: 'NOT_FOUND' } });
}
