/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare a password with a hash
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate a secure random token
 */
export declare function generateToken(length?: number): string;
/**
 * Generate a secure random string (alphanumeric)
 */
export declare function generateRandomString(length?: number): string;
/**
 * Generate a numeric OTP
 */
export declare function generateOtp(length?: number): string;
/**
 * Encrypt data using AES-256-GCM
 */
export declare function encrypt(text: string, key: string): string;
/**
 * Decrypt data using AES-256-GCM
 */
export declare function decrypt(encryptedText: string, key: string): string;
/**
 * Hash data using SHA-256
 */
export declare function sha256(data: string): string;
/**
 * Generate HMAC signature
 */
export declare function generateHmac(data: string, secret: string): string;
/**
 * Verify HMAC signature
 */
export declare function verifyHmac(data: string, signature: string, secret: string): boolean;
//# sourceMappingURL=crypto.d.ts.map