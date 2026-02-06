import { NotFoundError, ValidationError } from '@grandgold/utils';
import { CartService } from './cart.service';

const cartService = new CartService();

export class ReorderService {
  /**
   * Reorder from previous order
   */
  async reorder(orderId: string, userId: string): Promise<{
    cartId: string;
    itemsAdded: number;
    unavailableItems: string[];
  }> {
    // In production, fetch order from database
    const order = {
      id: orderId,
      items: [
        { productId: 'prd_1', quantity: 1, price: 45000 },
        { productId: 'prd_2', quantity: 2, price: 25000 },
      ],
    };

    if (!order) {
      throw new NotFoundError('Order');
    }

    const unavailableItems: string[] = [];
    let itemsAdded = 0;

    // Add each item to cart
    for (const item of order.items) {
      try {
        // Check if product is still available
        const productAvailable = true; // In production, check product service

        if (!productAvailable) {
          unavailableItems.push(item.productId);
          continue;
        }

        // Add to cart
        await cartService.addItem(userId, {
          productId: item.productId,
          quantity: item.quantity,
          country: 'IN', // In production, get from order
        });

        itemsAdded++;
      } catch (error) {
        unavailableItems.push(item.productId);
      }
    }

    if (itemsAdded === 0) {
      throw new ValidationError('No items available for reorder');
    }

    return {
      cartId: userId,
      itemsAdded,
      unavailableItems,
    };
  }

  /**
   * Get reorder suggestions
   */
  async getReorderSuggestions(_userId: string): Promise<{
    recentOrders: Record<string, unknown>[];
    frequentlyOrdered: Record<string, unknown>[];
  }> {
    // In production, fetch from order history
    return {
      recentOrders: [
        {
          orderId: 'ord_1',
          orderNumber: 'GG-IN-20250201-000001',
          date: new Date(),
          items: 2,
          total: 45000,
        },
      ],
      frequentlyOrdered: [
        {
          productId: 'prd_1',
          name: '22K Gold Necklace',
          orderCount: 3,
          lastOrdered: new Date(),
        },
      ],
    };
  }
}
