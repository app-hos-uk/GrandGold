import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@grandgold/utils';

export interface AuthUser {
  sub: string;
  email: string;
  role: string;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    req.user = decoded as AuthUser;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid token' },
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);
      req.user = decoded as AuthUser;
    }

    next();
  } catch {
    next();
  }
};
