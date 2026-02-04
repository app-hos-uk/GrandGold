import { generateId, NotFoundError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';
import type { AmlMatch, AmlScreeningResult, AmlAlert, PaginatedResult } from '../types/kyc.types';

// In-memory store for demo
const amlStore = new Map<string, AmlScreeningResult>();
const alertStore = new Map<string, AmlAlert>();

interface ScreeningInput {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
}

interface TransactionCheckInput {
  userId: string;
  amount: number;
  currency: string;
  transactionType: string;
  destinationCountry?: string;
}

// AML thresholds by country
const thresholds: Record<Country, { singleTransaction: number; daily: number; monthly: number }> = {
  IN: { singleTransaction: 1000000, daily: 2000000, monthly: 10000000 },
  AE: { singleTransaction: 55000, daily: 110000, monthly: 550000 },
  UK: { singleTransaction: 10000, daily: 25000, monthly: 100000 },
};

// High-risk countries
const highRiskCountries = ['AF', 'IR', 'KP', 'SY', 'YE'];

export class AmlService {
  /**
   * Perform AML screening
   */
  async performScreening(input: ScreeningInput): Promise<{
    userId: string;
    status: 'clear' | 'match' | 'potential_match';
    matches: AmlMatch[];
    riskScore: number;
    screenedAt: Date;
  }> {
    const screeningId = generateId('scr');
    
    // Mock screening - in production, call AML provider (e.g., ComplyAdvantage, Refinitiv)
    const result = {
      id: screeningId,
      userId: input.userId,
      status: 'clear' as const,
      matches: [],
      riskScore: 0.1,
      screenedAt: new Date(),
      sanctions: { matched: false, lists: [] },
      pep: { matched: false, category: null },
      adverseMedia: { matched: false, articles: [] },
    };
    
    // Store result
    amlStore.set(input.userId, result);
    
    return result;
  }

  /**
   * Get AML status for user
   */
  async getAmlStatus(userId: string): Promise<any> {
    const status = amlStore.get(userId);
    
    if (!status) {
      return {
        userId,
        screened: false,
        status: 'not_screened',
      };
    }
    
    return status;
  }

  /**
   * Check transaction against AML rules
   */
  async checkTransaction(input: TransactionCheckInput): Promise<{
    allowed: boolean;
    requiresReview: boolean;
    flags: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const flags: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let requiresReview = false;
    
    // Get user's AML status
    const amlStatus = await this.getAmlStatus(input.userId);
    
    // Check if user is screened
    if (!amlStatus.screened) {
      flags.push('User not AML screened');
      requiresReview = true;
    }
    
    // Check against thresholds
    const country = this.getUserCountry(input.userId);
    const countryThresholds = thresholds[country];
    
    if (input.amount >= countryThresholds.singleTransaction) {
      flags.push('Exceeds single transaction threshold');
      riskLevel = 'high';
      requiresReview = true;
    } else if (input.amount >= countryThresholds.singleTransaction * 0.5) {
      flags.push('Approaching transaction threshold');
      riskLevel = 'medium';
    }
    
    // Check destination country
    if (input.destinationCountry && highRiskCountries.includes(input.destinationCountry)) {
      flags.push('High-risk destination country');
      riskLevel = 'high';
      requiresReview = true;
    }
    
    // Check for suspicious patterns
    const patterns = await this.checkPatterns(input.userId);
    if (patterns.suspicious) {
      flags.push(...patterns.flags);
      riskLevel = patterns.riskLevel;
      requiresReview = true;
    }
    
    // Create alert if needed
    if (requiresReview) {
      await this.createAlert({
        userId: input.userId,
        type: 'transaction',
        amount: input.amount,
        currency: input.currency,
        flags,
        riskLevel,
      });
    }
    
    return {
      allowed: riskLevel !== 'high',
      requiresReview,
      flags,
      riskLevel,
    };
  }

  /**
   * Get AML alerts
   */
  async getAlerts(options: {
    status?: string;
    severity?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResult<AmlAlert>> {
    let alerts = Array.from(alertStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (options.status) {
      alerts = alerts.filter((a) => a.status === options.status);
    }
    
    if (options.severity) {
      alerts = alerts.filter((a) => a.severity === options.severity);
    }
    
    const total = alerts.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = alerts.slice(start, start + options.limit);
    
    return { data: paginatedData, total };
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    adminUserId: string,
    resolution: 'approved' | 'blocked' | 'escalated',
    notes?: string
  ): Promise<any> {
    const alert = alertStore.get(alertId);
    
    if (!alert) {
      throw new NotFoundError('Alert');
    }
    
    alert.status = 'resolved';
    alert.resolution = resolution;
    alert.resolvedBy = adminUserId;
    alert.resolvedAt = new Date();
    alert.notes = notes;
    
    alertStore.set(alertId, alert);
    
    return alert;
  }

  /**
   * Create an AML alert
   */
  private async createAlert(data: {
    userId: string;
    type: string;
    amount?: number;
    currency?: string;
    flags: string[];
    riskLevel: string;
  }): Promise<void> {
    const alertId = generateId('aml');
    
    const alert: AmlAlert = {
      id: alertId,
      userId: data.userId,
      type: data.type,
      severity: data.riskLevel as AmlAlert['severity'],
      riskLevel: data.riskLevel,
      description: `AML alert: ${data.type} for user ${data.userId}`,
      amount: data.amount,
      currency: data.currency,
      flags: data.flags,
      status: 'pending',
      createdAt: new Date(),
    };
    
    alertStore.set(alertId, alert);
  }

  /**
   * Check for suspicious transaction patterns
   */
  private async checkPatterns(userId: string): Promise<{
    suspicious: boolean;
    flags: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    // In production, analyze transaction history for patterns like:
    // - Structuring (splitting transactions to avoid thresholds)
    // - Round-trip transactions
    // - Rapid movement of funds
    // - Unusual transaction frequency
    
    return {
      suspicious: false,
      flags: [],
      riskLevel: 'low',
    };
  }

  /**
   * Get user's country (mock)
   */
  private getUserCountry(userId: string): Country {
    // In production, fetch from user service
    return 'IN';
  }
}
