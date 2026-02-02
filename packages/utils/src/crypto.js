import bcrypt from 'bcryptjs';
import crypto from 'crypto';
const SALT_ROUNDS = 12;
/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
/**
 * Compare a password with a hash
 */
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
/**
 * Generate a secure random token
 */
export function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}
/**
 * Generate a secure random string (alphanumeric)
 */
export function generateRandomString(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    return result;
}
/**
 * Generate a numeric OTP
 */
export function generateOtp(length = 6) {
    const digits = '0123456789';
    let otp = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        otp += digits[randomBytes[i] % 10];
    }
    return otp;
}
/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(key.padEnd(32).slice(0, 32));
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedText, key) {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const keyBuffer = Buffer.from(key.padEnd(32).slice(0, 32));
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Hash data using SHA-256
 */
export function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}
/**
 * Generate HMAC signature
 */
export function generateHmac(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}
/**
 * Verify HMAC signature
 */
export function verifyHmac(data, signature, secret) {
    const expectedSignature = generateHmac(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
//# sourceMappingURL=crypto.js.map