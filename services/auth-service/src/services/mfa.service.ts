import {
  generateMfaSecret,
  verifyTotpToken,
  generateBackupCodes,
  verifyBackupCode,
  generateQrCodeUrl,
  comparePassword,
  NotFoundError,
  ValidationError,
  AuthenticationError,
} from '@grandgold/utils';
import { findUserById, enableMfa, disableMfa, updateUser } from '@grandgold/database';

interface MfaStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

interface MfaSetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

export class MfaService {
  /**
   * Get MFA status for user
   */
  async getMfaStatus(userId: string): Promise<MfaStatus> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      enabled: user.mfaEnabled,
      backupCodesRemaining: (user.mfaBackupCodes as string[] || []).length,
    };
  }

  /**
   * Initialize MFA setup
   */
  async initMfaSetup(userId: string, email: string): Promise<MfaSetup> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.mfaEnabled) {
      throw new ValidationError('MFA is already enabled');
    }

    // Generate secret
    const secret = generateMfaSecret('GrandGold', email);

    return {
      secret: secret.base32,
      qrCode: generateQrCodeUrl(secret.otpauth_url),
      manualEntryKey: secret.base32,
    };
  }

  /**
   * Complete MFA setup by verifying a TOTP code
   */
  async completeMfaSetup(userId: string, secret: string, code: string): Promise<string[]> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.mfaEnabled) {
      throw new ValidationError('MFA is already enabled');
    }

    // Verify the code to ensure user set up correctly
    const isValid = verifyTotpToken({
      secret,
      token: code,
    });

    if (!isValid) {
      throw new ValidationError('Invalid verification code. Please try again.');
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Enable MFA
    await enableMfa(userId, secret, backupCodes);

    return backupCodes;
  }

  /**
   * Disable MFA
   */
  async disableMfa(userId: string, code: string, password: string): Promise<void> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.mfaEnabled) {
      throw new ValidationError('MFA is not enabled');
    }

    // Verify password
    if (user.passwordHash) {
      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid password');
      }
    }

    // Verify TOTP code
    if (!user.mfaSecret) {
      throw new Error('MFA secret not found');
    }

    const isCodeValid = verifyTotpToken({
      secret: user.mfaSecret,
      token: code,
    });

    if (!isCodeValid) {
      throw new ValidationError('Invalid verification code');
    }

    // Disable MFA
    await disableMfa(userId);
  }

  /**
   * Use a backup code
   */
  async useBackupCode(userId: string, backupCode: string): Promise<number> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.mfaEnabled) {
      throw new ValidationError('MFA is not enabled');
    }

    const storedCodes = user.mfaBackupCodes as string[] || [];
    
    const { valid, remainingCodes } = verifyBackupCode(backupCode, storedCodes);

    if (!valid) {
      throw new ValidationError('Invalid backup code');
    }

    // Update backup codes
    await updateUser(userId, { mfaBackupCodes: remainingCodes });

    return remainingCodes.length;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, code: string, password: string): Promise<string[]> {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.mfaEnabled) {
      throw new ValidationError('MFA is not enabled');
    }

    // Verify password
    if (user.passwordHash) {
      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid password');
      }
    }

    // Verify TOTP code
    if (!user.mfaSecret) {
      throw new Error('MFA secret not found');
    }

    const isCodeValid = verifyTotpToken({
      secret: user.mfaSecret,
      token: code,
    });

    if (!isCodeValid) {
      throw new ValidationError('Invalid verification code');
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes(10);

    // Update backup codes
    await updateUser(userId, { mfaBackupCodes: newBackupCodes });

    return newBackupCodes;
  }

  /**
   * Verify TOTP code (for login flow)
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await findUserById(userId);
    if (!user || !user.mfaSecret) {
      return false;
    }

    return verifyTotpToken({
      secret: user.mfaSecret,
      token: code,
    });
  }
}
