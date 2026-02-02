interface MfaSecret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url: string;
}
interface VerifyOptions {
    secret: string;
    token: string;
    window?: number;
}
/**
 * Generate MFA secret
 */
export declare function generateMfaSecret(issuer: string, label: string): MfaSecret;
/**
 * Verify TOTP token
 */
export declare function verifyTotpToken(options: VerifyOptions): boolean;
/**
 * Generate current TOTP token (for testing)
 */
export declare function generateTotpToken(secret: string): string;
/**
 * Generate backup codes
 */
export declare function generateBackupCodes(count?: number): string[];
/**
 * Verify backup code
 */
export declare function verifyBackupCode(code: string, storedCodes: string[]): {
    valid: boolean;
    remainingCodes: string[];
};
/**
 * Generate QR code URL for authenticator apps
 */
export declare function generateQrCodeUrl(otpauthUrl: string): string;
/**
 * Format backup codes for display
 */
export declare function formatBackupCodes(codes: string[]): string;
export {};
//# sourceMappingURL=mfa.d.ts.map