import jwt from 'jsonwebtoken';
let config = {
    secret: process.env.JWT_SECRET || 'default-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: 'grandgold',
    audience: 'grandgold-api',
};
/**
 * Configure JWT settings
 */
export function configureJwt(newConfig) {
    config = { ...config, ...newConfig };
}
/**
 * Generate access token
 */
export function generateAccessToken(payload) {
    const options = {
        expiresIn: config.accessExpiresIn,
        issuer: config.issuer,
        audience: config.audience,
    };
    return jwt.sign(payload, config.secret, options);
}
/**
 * Generate refresh token
 */
export function generateRefreshToken(userId) {
    const payload = { sub: userId, type: 'refresh' };
    const options = {
        expiresIn: config.refreshExpiresIn,
        issuer: config.issuer,
        audience: config.audience,
    };
    return jwt.sign(payload, config.secret, options);
}
/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(payload) {
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
export function verifyToken(token) {
    const options = {
        issuer: config.issuer,
        audience: config.audience,
    };
    return jwt.verify(token, config.secret, options);
}
/**
 * Decode a token without verification (for debugging)
 */
export function decodeToken(token) {
    return jwt.decode(token);
}
/**
 * Check if token is expired
 */
export function isTokenExpired(token) {
    try {
        const decoded = decodeToken(token);
        if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
            return true;
        }
        return decoded.exp * 1000 < Date.now();
    }
    catch {
        return true;
    }
}
/**
 * Get token expiry time
 */
export function getTokenExpiry(token) {
    try {
        const decoded = decodeToken(token);
        if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
            return null;
        }
        return new Date(decoded.exp * 1000);
    }
    catch {
        return null;
    }
}
/**
 * Parse expiry string to seconds
 */
function parseExpiryToSeconds(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match)
        return 900; // default 15 minutes
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
export function getUserIdFromToken(token) {
    try {
        const decoded = decodeToken(token);
        return decoded?.sub || null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map