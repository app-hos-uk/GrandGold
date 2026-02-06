import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthenticationError, AuthorizationError } from '@grandgold/utils';
import type { JwtPayload, UserRole, Country } from '@grandgold/types';

// Extend Express Request type
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      country?: Country;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
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

/**
 * Authorization middleware
 * Checks if user has required role
 */
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

/**
 * Permission middleware
 * Checks if user has specific permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }
    
    if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('*')) {
      next(new AuthorizationError(`Permission '${permission}' required`));
      return;
    }
    
    next();
  };
}

/**
 * Country restriction middleware
 * Ensures user can only access resources for their country
 */
export function restrictToCountry(...allowedCountries: Country[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }
    
    // Super admins can access all countries
    if (req.user.role === 'super_admin') {
      next();
      return;
    }
    
    if (!allowedCountries.includes(req.user.country)) {
      next(new AuthorizationError('Access not allowed for your country'));
      return;
    }
    
    next();
  };
}

/**
 * KYC tier restriction middleware
 */
export function requireKycTier(_minTier: 1 | 2) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }
    
    // Check KYC status from user claims or fetch from database
    // For now, we'll add this check in the route handlers
    next();
  };
}

/**
 * Optional authentication
 * Attaches user if token is present, but doesn't require it
 */
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
    // Invalid token, but continue without user
    next();
  }
}
