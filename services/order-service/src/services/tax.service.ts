import type { Country } from '@grandgold/types';
import type { TaxableItem } from '../types/internal';

interface TaxRule {
  category: string;
  destination: Country;
  rate: number;
  name: string;
}

// Dynamic tax rules (from admin configuration)
const taxRules: TaxRule[] = [
  // India - GST
  { category: 'gold_jewelry', destination: 'IN', rate: 3, name: 'GST' },
  { category: 'gold_bars', destination: 'IN', rate: 3, name: 'GST' },
  { category: 'gold_coins', destination: 'IN', rate: 3, name: 'GST' },
  { category: 'silver_jewelry', destination: 'IN', rate: 3, name: 'GST' },
  { category: 'diamond_jewelry', destination: 'IN', rate: 3, name: 'GST' },
  
  // UAE - VAT
  { category: 'gold_jewelry', destination: 'AE', rate: 5, name: 'VAT' },
  { category: 'gold_bars', destination: 'AE', rate: 0, name: 'VAT Exempt' },
  { category: 'gold_coins', destination: 'AE', rate: 0, name: 'VAT Exempt' },
  { category: 'silver_jewelry', destination: 'AE', rate: 5, name: 'VAT' },
  { category: 'diamond_jewelry', destination: 'AE', rate: 5, name: 'VAT' },
  
  // UK - VAT
  { category: 'gold_jewelry', destination: 'UK', rate: 20, name: 'VAT' },
  { category: 'gold_bars', destination: 'UK', rate: 0, name: 'Investment Gold' },
  { category: 'gold_coins', destination: 'UK', rate: 0, name: 'Investment Gold' },
  { category: 'silver_jewelry', destination: 'UK', rate: 20, name: 'VAT' },
  { category: 'diamond_jewelry', destination: 'UK', rate: 20, name: 'VAT' },
];

// Default tax rates if no specific rule
const defaultRates: Record<Country, number> = {
  IN: 3,
  AE: 5,
  UK: 20,
};

export class TaxService {
  /**
   * Calculate tax for cart items
   */
  async calculateTax(
    items: TaxableItem[],
    destination: Country
  ): Promise<{
    totalTax: number;
    breakdown: { productId: string; tax: number; rate: number; name: string }[];
  }> {
    const breakdown = items.map((item) => {
      const rule = this.findTaxRule(item.category || 'gold_jewelry', destination);
      const tax = (item.price * item.quantity * rule.rate) / 100;
      
      return {
        productId: item.productId,
        tax,
        rate: rule.rate,
        name: rule.name,
      };
    });
    
    const totalTax = breakdown.reduce((sum, item) => sum + item.tax, 0);
    
    return { totalTax, breakdown };
  }

  /**
   * Calculate tax for a single product
   */
  calculateProductTax(
    price: number,
    category: string,
    destination: Country
  ): { tax: number; rate: number; name: string } {
    const rule = this.findTaxRule(category, destination);
    const tax = (price * rule.rate) / 100;
    
    return { tax, rate: rule.rate, name: rule.name };
  }

  /**
   * Get tax rate for category and destination
   */
  getTaxRate(category: string, destination: Country): number {
    const rule = this.findTaxRule(category, destination);
    return rule.rate;
  }

  /**
   * Find applicable tax rule
   */
  private findTaxRule(category: string, destination: Country): { rate: number; name: string } {
    // Normalize category to match rules
    const normalizedCategory = this.normalizeCategory(category);
    
    const rule = taxRules.find(
      (r) => r.category === normalizedCategory && r.destination === destination
    );
    
    if (rule) {
      return { rate: rule.rate, name: rule.name };
    }
    
    // Return default rate for destination
    const names: Record<Country, string> = {
      IN: 'GST',
      AE: 'VAT',
      UK: 'VAT',
    };
    
    return {
      rate: defaultRates[destination],
      name: names[destination],
    };
  }

  /**
   * Normalize category name to match tax rules
   */
  private normalizeCategory(category: string): string {
    const mappings: Record<string, string> = {
      necklaces: 'gold_jewelry',
      earrings: 'gold_jewelry',
      rings: 'gold_jewelry',
      bracelets: 'gold_jewelry',
      bangles: 'gold_jewelry',
      pendants: 'gold_jewelry',
      mens_jewelry: 'gold_jewelry',
      gold_bars: 'gold_bars',
      gold_coins: 'gold_coins',
    };
    
    return mappings[category.toLowerCase()] || 'gold_jewelry';
  }

  /**
   * Calculate import duty for cross-border orders
   */
  calculateImportDuty(
    productValue: number,
    origin: Country,
    destination: Country,
    category: string
  ): { duty: number; rate: number; name: string } | null {
    // No duty for same-country orders
    if (origin === destination) {
      return null;
    }
    
    // Import duty rates (simplified)
    const dutyRates: Record<string, Record<Country, number>> = {
      gold_jewelry: {
        IN: 15, // Import to India
        AE: 5,  // Import to UAE
        UK: 0,  // No jewelry duty from India/UAE under certain thresholds
      },
      gold_bars: {
        IN: 12.5,
        AE: 0,
        UK: 0,
      },
    };
    
    const normalizedCategory = this.normalizeCategory(category);
    const rate = dutyRates[normalizedCategory]?.[destination] || 0;
    
    if (rate === 0) {
      return null;
    }
    
    return {
      duty: (productValue * rate) / 100,
      rate,
      name: 'Import Duty',
    };
  }
}
