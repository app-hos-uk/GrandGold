import { generateId, ValidationError } from '@grandgold/utils';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const OTP_TTL = 300; // 5 minutes
const EMAIL_CODE_TTL = 3600; // 1 hour

export class VerificationService {
  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string, email: string): Promise<void> {
    const code = this.generateCode(6);
    
    // Store in Redis
    await redis.setex(`email_verification:${userId}`, EMAIL_CODE_TTL, code);
    
    // Send email (mock - in production use email service)
    console.log(`Email verification code for ${email}: ${code}`);
  }

  /**
   * Verify email with code
   */
  async verifyEmail(userId: string, code: string): Promise<{ verified: boolean }> {
    const storedCode = await redis.get(`email_verification:${userId}`);
    
    if (!storedCode) {
      throw new ValidationError('Verification code expired or not found');
    }
    
    if (storedCode !== code) {
      throw new ValidationError('Invalid verification code');
    }
    
    // Delete the code
    await redis.del(`email_verification:${userId}`);
    
    return { verified: true };
  }

  /**
   * Send phone OTP
   */
  async sendPhoneOtp(userId: string, phone: string, countryCode: string): Promise<void> {
    const otp = this.generateCode(6);
    
    // Store in Redis
    await redis.setex(`phone_otp:${userId}`, OTP_TTL, otp);
    
    // Send SMS (mock - in production use SMS service like Twilio)
    console.log(`Phone OTP for ${countryCode}${phone}: ${otp}`);
  }

  /**
   * Verify phone with OTP
   */
  async verifyPhone(userId: string, otp: string): Promise<{ verified: boolean }> {
    const storedOtp = await redis.get(`phone_otp:${userId}`);
    
    if (!storedOtp) {
      throw new ValidationError('OTP expired or not found');
    }
    
    if (storedOtp !== otp) {
      throw new ValidationError('Invalid OTP');
    }
    
    // Delete the OTP
    await redis.del(`phone_otp:${userId}`);
    
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
