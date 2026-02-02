import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthenticationError } from '@grandgold/utils';
import type { JwtPayload, Country } from '@grandgold/types';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      country?: Country;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    const payload = verifyToken<JwtPayload>(token);
    
    req.user = payload;
    req.country = payload.country;
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid or expired token'));
    }
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken<JwtPayload>(token);
      req.user = payload;
      req.country = payload.country;
    }
    
    next();
  } catch {
    next();
  }
}
