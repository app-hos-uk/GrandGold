import type { OrderStatus } from '@grandgold/types';

/**
 * Veil Service
 * Implements the "Veil Logic" for seller anonymity
 * 
 * The platform actively masks seller identities during the browsing phase
 * to maintain a premium brand image. Products appear under a unified
 * "GrandGold Certified" interface.
 * 
 * Seller information is revealed only:
 * - Partially at checkout (business name only)
 * - Fully after payment confirmation
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VeilData = Record<string, any> & { items?: Record<string, any>[] };

const sellerFields = ['sellerId', 'sellerName', 'sellerContact', 'sellerAddress'];
const partialSellerFields = ['sellerContact', 'sellerAddress'];

function omitKeys<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!keys.includes(k)) result[k] = v;
  }
  return result;
}

export class VeilService {
  /**
   * Strip seller info from cart items
   */
  veilCart(cart: VeilData): VeilData {
    return {
      ...cart,
      items: (cart.items ?? []).map((item) => this.veilItem(item)),
    };
  }

  /**
   * Strip seller info from a single item
   */
  veilItem(item: Record<string, unknown>): Record<string, unknown> {
    const veiledItem = omitKeys(item, sellerFields);
    return {
      ...veiledItem,
      seller: {
        certified: true,
        badge: 'GrandGold Certified',
      },
    };
  }

  /**
   * Strip seller info from order based on status
   */
  veilOrder(order: VeilData, status: OrderStatus): VeilData {
    // Define which statuses allow full seller visibility
    const unveiledStatuses: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];
    
    if (unveiledStatuses.includes(status)) {
      return this.fullyUnveil(order);
    }
    
    // For pending/checkout, partial unveil
    if (status === 'pending') {
      return this.partialUnveil(order);
    }
    
    // For browsing/cart, full veil
    return this.fullVeil(order);
  }

  /**
   * Full veil - no seller info (for browsing/cart)
   */
  fullVeil(data: VeilData): VeilData {
    if (Array.isArray(data.items)) {
      return {
        ...data,
        items: data.items.map((item) => ({
          ...omitKeys(item, sellerFields),
          seller: {
            certified: true,
            badge: 'GrandGold Certified',
          },
        })),
      };
    }
    return data;
  }

  /**
   * Partial unveil - show seller name only (for checkout)
   */
  partialUnveil(data: VeilData): VeilData {
    if (Array.isArray(data.items)) {
      return {
        ...data,
        items: data.items.map((item) => ({
          ...omitKeys(item, partialSellerFields),
          seller: {
            id: item.sellerId,
            name: (item.sellerName as string) || 'GrandGold Partner',
            certified: true,
            badge: 'Verified Seller',
          },
        })),
      };
    }
    return data;
  }

  /**
   * Fully unveil - show all seller info (after payment)
   */
  fullyUnveil(data: VeilData): VeilData {
    if (Array.isArray(data.items)) {
      return {
        ...data,
        items: data.items.map((item) => ({
          ...item,
          seller: {
            id: item.sellerId,
            name: (item.sellerName as string) || 'GrandGold Partner',
            contact: item.sellerContact,
            address: item.sellerAddress,
            certified: true,
            badge: 'Verified Seller',
          },
        })),
      };
    }
    return data;
  }

  /**
   * Strip metadata from API responses
   * This prevents "inspect element" leakage of seller data
   */
  sanitizeResponse(data: Record<string, unknown>, revealLevel: 'none' | 'partial' | 'full'): Record<string, unknown> {
    const sensitiveFields = [
      'sellerId', 
      'sellerEmail', 
      'sellerPhone', 
      'sellerBankDetails',
      'commissionRate',
      'supplierPrice',
      'internalNotes',
    ];

    const deepSanitize = (obj: unknown): unknown => {
      if (Array.isArray(obj)) {
        return obj.map(deepSanitize);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: Record<string, unknown> = {};
        
        for (const [key, value] of Object.entries(obj)) {
          // Always remove internal fields
          if (['internalNotes', 'supplierPrice', 'commissionRate', 'sellerBankDetails'].includes(key)) {
            continue;
          }
          
          // Remove seller fields based on reveal level
          if (revealLevel === 'none' && sensitiveFields.includes(key)) {
            continue;
          }
          
          if (revealLevel === 'partial' && ['sellerEmail', 'sellerPhone', 'sellerBankDetails'].includes(key)) {
            continue;
          }
          
          sanitized[key] = deepSanitize(value);
        }
        
        return sanitized;
      }
      
      return obj;
    };

    return deepSanitize(data) as Record<string, unknown>;
  }

  /**
   * Check if seller info should be revealed based on context
   */
  shouldRevealSeller(context: {
    stage: 'browsing' | 'cart' | 'checkout' | 'payment' | 'post_payment';
    userRole?: string;
    orderStatus?: OrderStatus;
  }): 'none' | 'partial' | 'full' {
    // Admin always sees full info
    if (context.userRole === 'super_admin' || context.userRole === 'country_admin') {
      return 'full';
    }

    // Sellers see full info for their own products
    if (context.userRole === 'seller') {
      return 'full';
    }

    // Customer journey stages
    switch (context.stage) {
      case 'browsing':
      case 'cart':
        return 'none';
      case 'checkout':
        return 'partial';
      case 'payment':
      case 'post_payment':
        return 'full';
      default:
        return 'none';
    }
  }
}
