import { generateId, ValidationError } from '@grandgold/utils';
import Redis from 'ioredis';

let _redisClient: Redis | null = null;
const _fallbackStore = new Map<string, { value: string; expiresAt: number }>();

function getRedisClient(): Redis | null {
  if (_redisClient) return _redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    _redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times <= 2 ? 500 : null),
      lazyConnect: true,
    });
    _redisClient.on('error', () => {});
  } catch {
    return null;
  }
  return _redisClient;
}

function fallbackGet(key: string): string | null {
  const entry = _fallbackStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _fallbackStore.delete(key);
    return null;
  }
  return entry.value;
}

function fallbackSetex(key: string, ttl: number, value: string): void {
  _fallbackStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

function fallbackDel(key: string): void {
  _fallbackStore.delete(key);
}

const OTP_TTL = 300; // 5 minutes
const EMAIL_CODE_TTL = 3600; // 1 hour

export class VerificationService {
  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string, email: string): Promise<void> {
    const code = this.generateCode(6);
    const key = `email_verification:${userId}`;
    const redis = getRedisClient();

    if (redis) {
      try { await redis.setex(key, EMAIL_CODE_TTL, code); } catch {
        fallbackSetex(key, EMAIL_CODE_TTL, code);
      }
    } else {
      fallbackSetex(key, EMAIL_CODE_TTL, code);
    }

    console.log(`Email verification code for ${email}: ${code}`);
  }

  /**
   * Verify email with code
   */
  async verifyEmail(userId: string, code: string): Promise<{ verified: boolean }> {
    const key = `email_verification:${userId}`;
    let storedCode: string | null = null;
    const redis = getRedisClient();

    if (redis) {
      try { storedCode = await redis.get(key); } catch { /* no-op */ }
    }
    if (!storedCode) storedCode = fallbackGet(key);

    if (!storedCode) {
      throw new ValidationError('Verification code expired or not found');
    }

    if (storedCode !== code) {
      throw new ValidationError('Invalid verification code');
    }

    if (redis) {
      try { await redis.del(key); } catch { /* no-op */ }
    }
    fallbackDel(key);

    return { verified: true };
  }

  /**
   * Send phone OTP
   */
  async sendPhoneOtp(userId: string, phone: string, countryCode: string): Promise<void> {
    const otp = this.generateCode(6);
    const key = `phone_otp:${userId}`;
    const redis = getRedisClient();

    if (redis) {
      try { await redis.setex(key, OTP_TTL, otp); } catch {
        fallbackSetex(key, OTP_TTL, otp);
      }
    } else {
      fallbackSetex(key, OTP_TTL, otp);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Phone OTP generated for ${countryCode}${phone}`);
    }
  }

  /**
   * Verify phone with OTP
   */
  async verifyPhone(userId: string, otp: string): Promise<{ verified: boolean }> {
    const key = `phone_otp:${userId}`;
    let storedOtp: string | null = null;
    const redis = getRedisClient();

    if (redis) {
      try { storedOtp = await redis.get(key); } catch { /* no-op */ }
    }
    if (!storedOtp) storedOtp = fallbackGet(key);

    if (!storedOtp) {
      throw new ValidationError('OTP expired or not found');
    }

    if (storedOtp !== otp) {
      throw new ValidationError('Invalid OTP');
    }

    if (redis) {
      try { await redis.del(key); } catch { /* no-op */ }
    }
    fallbackDel(key);

    return { verified: true };
  }

  /**
   * Extract document data using OCR / Document AI
   */
  async extractDocumentData(
    documentId: string,
    documentType: string
  ): Promise<{
    success: boolean;
    extractedData: Record<string, string>;
    confidence: number;
  }> {
    const { DocumentAIService } = await import('./document-ai.service');
    const docAIService = new DocumentAIService();
    
    // In production, fetch document bytes from Cloud Storage using documentId
    // For now, use placeholder bytes - Document AI will use fallback OCR
    const documentBytes = Buffer.alloc(1); // Placeholder - replaced when fetching from GCS
    
    const validTypes = ['passport', 'national_id', 'drivers_license', 'emirates_id', 'aadhaar', 'pan'];
    const docType = validTypes.includes(documentType) 
      ? documentType as 'passport' | 'national_id' | 'drivers_license' | 'emirates_id' | 'aadhaar' | 'pan'
      : 'national_id';
    
    const result = await docAIService.processDocumentWithOCR(documentBytes, docType);
    
    return {
      success: result.success,
      extractedData: Object.fromEntries(
        Object.entries(result.fields || result.extractedData || {}).map(([k, v]) => [
          k,
          typeof v === 'object' && v !== null && 'value' in v ? String((v as any).value) : String(v),
        ])
      ),
      confidence: result.confidence,
    };
  }

  /**
   * Perform liveness check
   */
  async performLivenessCheck(
    userId: string,
    selfieImage: string,
    challengeResponse: any
  ): Promise<{
    isLive: boolean;
    confidence: number;
    challenges: { type: string; passed: boolean }[];
  }> {
    // In production, use face recognition API
    // Mock response
    return {
      isLive: true,
      confidence: 0.98,
      challenges: [
        { type: 'blink', passed: true },
        { type: 'turn_left', passed: true },
        { type: 'smile', passed: true },
      ],
    };
  }

  /**
   * Match faces between selfie and document
   */
  async matchFaces(
    _selfieId: string,
    _documentId: string
  ): Promise<{
    match: boolean;
    similarity: number;
    threshold: number;
  }> {
    // In production, use face recognition API
    // Mock response
    return {
      match: true,
      similarity: 0.92,
      threshold: 0.8,
    };
  }

  /**
   * Generate random numeric code
   */
  private generateCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }
}
