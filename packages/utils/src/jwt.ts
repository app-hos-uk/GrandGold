import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import type { JwtPayload, TokenPair } from '@grandgold/types';

interface JwtConfig {
  secret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  issuer?: string;
  audience?: string;
}

let config: JwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: 'grandgold',
  audience: 'grandgold-api',
};

/**
 * Configure JWT settings
 */
export function configureJwt(newConfig: Partial<JwtConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: config.accessExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: config.issuer,
    audience: config.audience,
  };
  
  return jwt.sign(payload, config.secret, options);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string): string {
  const payload = { sub: userId, type: 'refresh' };
  const options: SignOptions = {
    expiresIn: config.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: config.issuer,
    audience: config.audience,
  };
  
  return jwt.sign(payload, config.secret, options);
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.sub);
  
  // Parse expiry to seconds
  const expiresIn = parseExpiryToSeconds(config.accessExpiresIn);
  
  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify and decode a token
 */
export function verifyToken<T = JwtPayload>(token: string): T {
  const options: VerifyOptions = {
    issuer: config.issuer,
    audience: config.audience,
  };
  
  return jwt.verify(token, config.secret, options) as T;
}

/**
 * Decode a token without verification (for debugging)
 */
export function decodeToken<T = JwtPayload>(token: string): T | null {
  return jwt.decode(token) as T | null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}

/**
 * Parse expiry string to seconds
 */
function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 900;
  }
}

/**
 * Extract user ID from token
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = decodeToken(token);
    return decoded?.sub || null;
  } catch {
    return null;
  }
}
