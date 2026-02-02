import Redis from 'ioredis';
import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';

// Redis client for cart storage
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CART_TTL = 60 * 60 * 24 * 7; // 7 days

interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  quantity: number;
  goldWeight?: number;
  purity?: string;
  priceModel: 'fixed' | 'dynamic';
  sellerId: string; // Stored but not exposed (Veil Logic)
  addedAt: Date;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  currency: string;
  country: Country;
  createdAt: Date;
  updatedAt: Date;
}

export class CartService {
  private async getCartKey(cartId: string): Promise<string> {
    return `cart:${cartId}`;
  }

  /**
   * Get cart
   */
  async getCart(cartId: string): Promise<Cart> {
    const key = await this.getCartKey(cartId);
    const data = await redis.get(key);
    
    if (!data) {
      // Return empty cart
      return {
        id: cartId,
        items: [],
        subtotal: 0,
        itemCount: 0,
        currency: 'INR',
        country: 'IN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    return JSON.parse(data);
  }

  /**
   * Add item to cart
   */
  async addItem(cartId: string, data: { productId: string; quantity: number; country: string }): Promise<Cart> {
    const cart = await this.getCart(cartId);
    
    // Fetch product details (mock - in production, call product service)
    const product = await this.fetchProduct(data.productId);
    
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    // Check stock
    if (product.stockQuantity < data.quantity) {
      throw new ValidationError('Insufficient stock');
    }
    
    // Check if item already in cart
    const existingIndex = cart.items.findIndex((i) => i.productId === data.productId);
    
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += data.quantity;
    } else {
      cart.items.push({
        productId: data.productId,
        name: product.name,
        image: product.images[0]?.url || '',
        price: product.currentPrice,
        originalPrice: product.basePrice,
        quantity: data.quantity,
        goldWeight: product.goldWeight,
        purity: product.purity,
        priceModel: product.pricingModel,
        sellerId: product.sellerId, // Stored but hidden
        addedAt: new Date(),
      });
    }
    
    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.country = data.country as Country;
    cart.updatedAt = new Date();
    
    // Save to Redis
    const key = await this.getCartKey(cartId);
    await redis.setex(key, CART_TTL, JSON.stringify(cart));
    
    return cart;
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(cartId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(cartId);
    
    const itemIndex = cart.items.findIndex((i) => i.productId === productId);
    
    if (itemIndex < 0) {
      throw new NotFoundError('Cart item');
    }
    
    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock
      const product = await this.fetchProduct(productId);
      if (product && product.stockQuantity < quantity) {
        throw new ValidationError('Insufficient stock');
      }
      cart.items[itemIndex].quantity = quantity;
    }
    
    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date();
    
    // Save to Redis
    const key = await this.getCartKey(cartId);
    await redis.setex(key, CART_TTL, JSON.stringify(cart));
    
    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItem(cartId: string, productId: string): Promise<Cart> {
    return this.updateItemQuantity(cartId, productId, 0);
  }

  /**
   * Clear cart
   */
  async clearCart(cartId: string): Promise<void> {
    const key = await this.getCartKey(cartId);
    await redis.del(key);
  }

  /**
   * Merge guest cart with user cart
   */
  async mergeCarts(guestCartId: string, userCartId: string): Promise<Cart> {
    const guestCart = await this.getCart(guestCartId);
    const userCart = await this.getCart(userCartId);
    
    // Merge items
    for (const guestItem of guestCart.items) {
      const existingIndex = userCart.items.findIndex((i) => i.productId === guestItem.productId);
      
      if (existingIndex >= 0) {
        // Keep the higher quantity
        userCart.items[existingIndex].quantity = Math.max(
          userCart.items[existingIndex].quantity,
          guestItem.quantity
        );
      } else {
        userCart.items.push(guestItem);
      }
    }
    
    // Recalculate totals
    userCart.subtotal = userCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    userCart.itemCount = userCart.items.reduce((sum, item) => sum + item.quantity, 0);
    userCart.updatedAt = new Date();
    
    // Save merged cart and delete guest cart
    const userKey = await this.getCartKey(userCartId);
    const guestKey = await this.getCartKey(guestCartId);
    
    await redis.setex(userKey, CART_TTL, JSON.stringify(userCart));
    await redis.del(guestKey);
    
    return userCart;
  }

  /**
   * Validate cart before checkout
   */
  async validateCart(cartId: string): Promise<{
    valid: boolean;
    issues: { productId: string; issue: string }[];
    priceChanges: { productId: string; oldPrice: number; newPrice: number }[];
  }> {
    const cart = await this.getCart(cartId);
    const issues: { productId: string; issue: string }[] = [];
    const priceChanges: { productId: string; oldPrice: number; newPrice: number }[] = [];
    
    for (const item of cart.items) {
      const product = await this.fetchProduct(item.productId);
      
      if (!product) {
        issues.push({ productId: item.productId, issue: 'Product no longer available' });
        continue;
      }
      
      if (product.stockQuantity < item.quantity) {
        issues.push({
          productId: item.productId,
          issue: `Only ${product.stockQuantity} items available`,
        });
      }
      
      if (product.currentPrice !== item.price) {
        priceChanges.push({
          productId: item.productId,
          oldPrice: item.price,
          newPrice: product.currentPrice,
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
      priceChanges,
    };
  }

  /**
   * Get item count
   */
  async getItemCount(cartId: string): Promise<number> {
    const cart = await this.getCart(cartId);
    return cart.itemCount;
  }

  /**
   * Fetch product (mock - in production, call product service)
   */
  private async fetchProduct(productId: string): Promise<any | null> {
    // Mock product
    return {
      id: productId,
      name: '22K Gold Necklace',
      images: [{ url: 'https://example.com/image.jpg' }],
      currentPrice: 125000,
      basePrice: 125000,
      goldWeight: 15,
      purity: '22K',
      pricingModel: 'dynamic',
      sellerId: 'sel_abc123',
      stockQuantity: 5,
    };
  }
}
