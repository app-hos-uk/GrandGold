import type { Country } from '@grandgold/types';

export interface ShippingQuote {
  carrier: string;
  service: string;
  price: number;
  currency: string;
  estimatedDays: string;
  estimatedDeliveryDate?: string;
  insuranceIncluded: boolean;
}

export interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
  estimatedDate: string;
  cutoffTime?: string;
}

export class LogisticsService {
  /**
   * Get real-time shipping quotes for an address
   */
  async getShippingQuotes(
    country: Country,
    postalCode: string,
    subtotal: number,
    weightKg?: number
  ): Promise<ShippingQuote[]> {
    const weight = weightKg ?? 0.5; // Default 500g for jewelry

    const quotes: ShippingQuote[] = [];

    // Standard shipping
    const standardPrice = this.getStandardRate(country, subtotal);
    quotes.push({
      carrier: 'GrandGold',
      service: 'Standard Delivery',
      price: standardPrice,
      currency: country === 'IN' ? 'INR' : country === 'AE' ? 'AED' : 'GBP',
      estimatedDays: country === 'IN' ? '5-7' : country === 'AE' ? '4-6' : '7-10',
      insuranceIncluded: subtotal > 50000,
    });

    // Express shipping
    quotes.push({
      carrier: 'DHL',
      service: 'Express',
      price: this.getExpressRate(country),
      currency: country === 'IN' ? 'INR' : country === 'AE' ? 'AED' : 'GBP',
      estimatedDays: country === 'IN' ? '2-3' : country === 'AE' ? '2-3' : '3-5',
      insuranceIncluded: true,
    });

    return quotes;
  }

  /**
   * Get delivery time estimate
   */
  async getDeliveryEstimate(
    country: Country,
    postalCode: string
  ): Promise<DeliveryEstimate> {
    const now = new Date();
    const minDays = country === 'IN' ? 5 : country === 'AE' ? 4 : 7;
    const maxDays = country === 'IN' ? 7 : country === 'AE' ? 6 : 10;

    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + minDays);
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + maxDays);

    return {
      minDays,
      maxDays,
      estimatedDate: `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`,
      cutoffTime: '2:00 PM',
    };
  }

  /**
   * Calculate import duty (for cross-border)
   */
  async calculateImportDuty(
    destinationCountry: Country,
    productValue: number,
    productCategory: string
  ): Promise<{ duty: number; tax: number; total: number }> {
    // Simplified - in production integrate with customs APIs
    const dutyRate = destinationCountry === 'UK' ? 0.02 : 0; // 2% for UK imports
    const taxRate = destinationCountry === 'UK' ? 0.2 : 0; // 20% VAT
    const duty = Math.round(productValue * dutyRate);
    const tax = Math.round((productValue + duty) * taxRate);
    return { duty, tax, total: duty + tax };
  }

  private getStandardRate(country: Country, subtotal: number): number {
    const freeThresholds: Record<Country, number> = {
      IN: 50000,
      AE: 2000,
      UK: 500,
    };
    if (subtotal >= freeThresholds[country]) return 0;

    const rates: Record<Country, number> = {
      IN: 500,
      AE: 75,
      UK: 25,
    };
    return rates[country] ?? 500;
  }

  private getExpressRate(country: Country): number {
    const rates: Record<Country, number> = {
      IN: 1500,
      AE: 150,
      UK: 50,
    };
    return rates[country] ?? 1500;
  }

  /**
   * DHL Express - Create pickup booking
   */
  async createDHLPickup(request: {
    orderId: string;
    address: { line1: string; city: string; postalCode: string; country: string };
    weightKg: number;
    packages: number;
  }): Promise<{ trackingNumber: string; pickupDate: string; labelUrl: string }> {
    // In production: DHL API integration
    return {
      trackingNumber: `DHL${Date.now()}`,
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      labelUrl: `https://grandgold.shipping/dhl/label/${request.orderId}`,
    };
  }

  /**
   * Generate return shipping label
   */
  async generateReturnLabel(request: {
    returnId: string;
    orderId: string;
    address: { line1: string; city: string; postalCode: string; country: string };
  }): Promise<{ labelUrl: string; trackingNumber: string }> {
    return {
      labelUrl: `https://grandgold.shipping/return/${request.returnId}/label`,
      trackingNumber: `RET${Date.now()}`,
    };
  }

  /**
   * Validate map picker coordinates (geofencing)
   */
  async validateDeliveryLocation(
    country: Country,
    lat: number,
    lng: number
  ): Promise<{ valid: boolean; serviceable: boolean; message?: string }> {
    // Simplified geofence - in production use actual coverage polygons
    const bounds: Record<Country, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
      IN: { minLat: 8, maxLat: 37, minLng: 68, maxLng: 97 },
      AE: { minLat: 22, maxLat: 27, minLng: 51, maxLng: 57 },
      UK: { minLat: 49, maxLat: 61, minLng: -9, maxLng: 2 },
    };
    const b = bounds[country];
    const valid = lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
    return {
      valid,
      serviceable: valid,
      message: valid ? undefined : 'Delivery not available to this location',
    };
  }
}
