import { generateId } from '@grandgold/utils';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface FraudCheckInput {
  userId: string;
  amount: number;
  currency: string;
  country: string;
  paymentMethod: string;
  ipAddress: string;
  deviceId?: string;
  billingAddress?: any;
  shippingAddress?: any;
}

interface FraudScore {
  score: number; // 0-100, higher = more risky
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendation: 'approve' | 'review' | 'reject';
}

export class FraudDetectionService {
  /**
   * Check for fraud
   */
  async checkFraud(input: FraudCheckInput): Promise<FraudScore> {
    const flags: string[] = [];
    let score = 0;

    // Check 1: Unusual amount
    const userAvgAmount = await this.getUserAverageAmount(input.userId);
    if (input.amount > userAvgAmount * 3) {
      score += 20;
      flags.push('Amount significantly higher than user average');
    }

    // Check 2: Velocity check
    const recentTransactions = await this.getRecentTransactions(input.userId);
    if (recentTransactions > 5) {
      score += 15;
      flags.push('High transaction velocity');
    }

    // Check 3: IP address check
    const ipRisk = await this.checkIPAddress(input.ipAddress);
    score += ipRisk.score;
    if (ipRisk.flags.length > 0) {
      flags.push(...ipRisk.flags);
    }

    // Check 4: Device fingerprint
    if (input.deviceId) {
      const deviceRisk = await this.checkDevice(input.deviceId, input.userId);
      score += deviceRisk.score;
      if (deviceRisk.flags.length > 0) {
        flags.push(...deviceRisk.flags);
      }
    }

    // Check 5: Address mismatch
    if (input.billingAddress && input.shippingAddress) {
      const addressMatch = this.compareAddresses(
        input.billingAddress,
        input.shippingAddress
      );
      if (!addressMatch) {
        score += 10;
        flags.push('Billing and shipping addresses do not match');
      }
    }

    // Check 6: Country mismatch
    const userCountry = await this.getUserCountry(input.userId);
    if (userCountry && userCountry !== input.country) {
      score += 15;
      flags.push('Transaction from different country than user profile');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let recommendation: 'approve' | 'review' | 'reject';

    if (score < 30) {
      riskLevel = 'low';
      recommendation = 'approve';
    } else if (score < 50) {
      riskLevel = 'medium';
      recommendation = 'review';
    } else if (score < 75) {
      riskLevel = 'high';
      recommendation = 'review';
    } else {
      riskLevel = 'critical';
      recommendation = 'reject';
    }

    return {
      score,
      riskLevel,
      flags,
      recommendation,
    };
  }

  /**
   * Get user's average transaction amount
   */
  private async getUserAverageAmount(userId: string): Promise<number> {
    const key = `fraud:avg_amount:${userId}`;
    const cached = await redis.get(key);

    if (cached) {
      return parseFloat(cached);
    }

    // In production, calculate from transaction history
    const avgAmount = 50000; // Mock
    await redis.setex(key, 3600, avgAmount.toString());

    return avgAmount;
  }

  /**
   * Get recent transaction count
   */
  private async getRecentTransactions(userId: string): Promise<number> {
    const key = `fraud:recent_txns:${userId}`;
    const count = await redis.get(key);

    if (count) {
      return parseInt(count);
    }

    // In production, count from database
    return 0;
  }

  /**
   * Check IP address risk
   */
  private async checkIPAddress(ipAddress: string): Promise<{
    score: number;
    flags: string[];
  }> {
    const flags: string[] = [];
    let score = 0;

    // Check if IP is from known VPN/proxy
    const isVPN = await this.isVPN(ipAddress);
    if (isVPN) {
      score += 10;
      flags.push('IP address from VPN/Proxy');
    }

    // Check if IP is from high-risk country
    const countryRisk = await this.getCountryRisk(ipAddress);
    if (countryRisk > 50) {
      score += 15;
      flags.push('IP address from high-risk country');
    }

    return { score, flags };
  }

  /**
   * Check device risk
   */
  private async checkDevice(deviceId: string, userId: string): Promise<{
    score: number;
    flags: string[];
  }> {
    const flags: string[] = [];
    let score = 0;

    // Check if device is new for user
    const isNewDevice = await this.isNewDevice(deviceId, userId);
    if (isNewDevice) {
      score += 5;
      flags.push('New device detected');
    }

    return { score, flags };
  }

  /**
   * Compare addresses
   */
  private compareAddresses(address1: any, address2: any): boolean {
    return (
      address1.postalCode === address2.postalCode &&
      address1.city === address2.city
    );
  }

  /**
   * Get user country
   */
  private async getUserCountry(userId: string): Promise<string | null> {
    const key = `user:country:${userId}`;
    return await redis.get(key);
  }

  /**
   * Check if IP is VPN
   */
  private async isVPN(ipAddress: string): Promise<boolean> {
    // In production, use VPN detection service
    return false;
  }

  /**
   * Get country risk score
   */
  private async getCountryRisk(ipAddress: string): Promise<number> {
    // In production, use IP geolocation and risk database
    return 0;
  }

  /**
   * Check if device is new
   */
  private async isNewDevice(deviceId: string, userId: string): Promise<boolean> {
    const key = `user:devices:${userId}`;
    const exists = await redis.sismember(key, deviceId);

    if (!exists) {
      await redis.sadd(key, deviceId);
      return true;
    }

    return false;
  }
}
