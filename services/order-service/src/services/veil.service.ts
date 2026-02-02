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
export class VeilService {
  /**
   * Strip seller info from cart items
   */
  veilCart(cart: any): any {
    return {
      ...cart,
      items: cart.items.map((item: any) => this.veilItem(item)),
    };
  }

  /**
   * Strip seller info from a single item
   */
  veilItem(item: any): any {
    const { sellerId, sellerName, sellerContact, sellerAddress, ...veiledItem } = item;
    
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
  veilOrder(order: any, status: OrderStatus): any {
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
  fullVeil(data: any): any {
    if (Array.isArray(data.items)) {
      return {
        ...data,
        items: data.items.map((item: any) => {
          const { sellerId, sellerName, sellerContact, sellerAddress, ...veiledItem } = item;
          return {
            ...veiledItem,
            seller: {
              certified: true,
              badge: 'GrandGold Certified',
            },
          };
        }),
      };
    }
    return data;
  }

  /**
   * Partial unveil - show seller name only (for checkout)
   */
  partialUnveil(data: any): any {
    if (Array.isArray(data.items)) {
      return {
        ...data,
        items: data.items.map((item: any) => {
          const { sellerContact, sellerAddress, ...partialItem } = item;
          return {
            ...partialItem,
            seller: {
              id: item.sellerId,
              name: item.sellerName || 'GrandGold Partner',
              certified: true,
              badge: 'Verified Seller',
            },
          };
        }),
      };
    }
    return data;
  }

  /**
   * Fully unveil - show all seller info (after payment)
   */
  fullyUnveil(data: any): any {
    if (Array.isArray(data.items)) {
      return {
        ...data,
        items: data.items.map((item: any) => ({
          ...item,
          seller: {
            id: item.sellerId,
            name: item.sellerName || 'GrandGold Partner',
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
  sanitizeResponse(data: any, revealLevel: 'none' | 'partial' | 'full'): any {
    const sensitiveFields = [
      'sellerId', 
      'sellerEmail', 
      'sellerPhone', 
      'sellerBankDetails',
      'commissionRate',
      'supplierPrice',
      'internalNotes',
    ];

    const deepSanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(deepSanitize);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: Record<string, any> = {};
        
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

    return deepSanitize(data);
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
