import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthenticationError, AuthorizationError } from '@grandgold/utils';
import type { JwtPayload, UserRole, Country } from '@grandgold/types';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      country?: Country;
    }
  }
}

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

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }
    
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      next(new AuthorizationError('Insufficient permissions'));
      return;
    }
    
    next();
  };
}

export function requireSeller(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AuthenticationError('Authentication required'));
    return;
  }
  
  if (req.user.role !== 'seller' && req.user.role !== 'super_admin' && req.user.role !== 'country_admin') {
    next(new AuthorizationError('Seller account required'));
    return;
  }
  
  next();
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
