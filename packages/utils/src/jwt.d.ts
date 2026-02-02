import type { JwtPayload, TokenPair } from '@grandgold/types';
interface JwtConfig {
    secret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
    issuer?: string;
    audience?: string;
}
/**
 * Configure JWT settings
 */
export declare function configureJwt(newConfig: Partial<JwtConfig>): void;
/**
 * Generate access token
 */
export declare function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
/**
 * Generate refresh token
 */
export declare function generateRefreshToken(userId: string): string;
/**
 * Generate token pair (access + refresh)
 */
export declare function generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair;
/**
 * Verify and decode a token
 */
export declare function verifyToken<T = JwtPayload>(token: string): T;
/**
 * Decode a token without verification (for debugging)
 */
export declare function decodeToken<T = JwtPayload>(token: string): T | null;
/**
 * Check if token is expired
 */
export declare function isTokenExpired(token: string): boolean;
/**
 * Get token expiry time
 */
export declare function getTokenExpiry(token: string): Date | null;
/**
 * Extract user ID from token
 */
export declare function getUserIdFromToken(token: string): string | null;
export {};
//# sourceMappingURL=jwt.d.ts.map