import speakeasy from 'speakeasy';
import { generateRandomString } from './crypto';
/**
 * Generate MFA secret
 */
export function generateMfaSecret(issuer, label) {
    const secret = speakeasy.generateSecret({
        name: `${issuer}:${label}`,
        issuer: issuer,
        length: 32,
    });
    return {
        ascii: secret.ascii,
        hex: secret.hex,
        base32: secret.base32,
        otpauth_url: secret.otpauth_url,
    };
}
/**
 * Verify TOTP token
 */
export function verifyTotpToken(options) {
    return speakeasy.totp.verify({
        secret: options.secret,
        encoding: 'base32',
        token: options.token,
        window: options.window ?? 1, // Allow 1 step before/after for clock drift
    });
}
/**
 * Generate current TOTP token (for testing)
 */
export function generateTotpToken(secret) {
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32',
    });
}
/**
 * Generate backup codes
 */
export function generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = generateRandomString(8).toUpperCase();
        // Format as XXXX-XXXX
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
}
/**
 * Verify backup code
 */
export function verifyBackupCode(code, storedCodes) {
    const normalizedCode = code.toUpperCase().replace(/-/g, '');
    const index = storedCodes.findIndex((storedCode) => {
        const normalizedStored = storedCode.toUpperCase().replace(/-/g, '');
        return normalizedStored === normalizedCode;
    });
    if (index === -1) {
        return { valid: false, remainingCodes: storedCodes };
    }
    // Remove used code
    const remainingCodes = [...storedCodes];
    remainingCodes.splice(index, 1);
    return { valid: true, remainingCodes };
}
/**
 * Generate QR code URL for authenticator apps
 */
export function generateQrCodeUrl(otpauthUrl) {
    // Use Google Charts API for QR code generation
    const encoded = encodeURIComponent(otpauthUrl);
    return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encoded}`;
}
/**
 * Format backup codes for display
 */
export function formatBackupCodes(codes) {
    return codes.map((code, index) => `${index + 1}. ${code}`).join('\n');
}
//# sourceMappingURL=mfa.js.map