import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country, GoldPurity } from '@grandgold/types';

// In-memory store for demo
const productStore = new Map<string, any>();

interface CreateProductInput {
  name: string;
  description?: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  pricingModel: 'fixed' | 'dynamic';
  basePrice: number;
  goldWeight?: number;
  purity?: GoldPurity;
  metalType?: string;
  laborCost?: number;
  makingCharges?: number;
  stones?: { type: string; count: number; caratWeight?: number; value: number }[];
  specifications: {
    weight: number;
    dimensions?: { length?: number; width?: number; height?: number; unit: string };
    hallmarkNumber?: string;
    certifications?: string[];
  };
  stockQuantity: number;
  arEnabled?: boolean;
  countries: Country[];
}

export class ProductService {
  /**
   * Create a new product
   */
  async createProduct(userId: string, input: CreateProductInput): Promise<any> {
    const productId = generateId('prd');
    const sku = this.generateSku(input.category);

    const product = {
      id: productId,
      sku,
      sellerId: userId, // In production, get actual seller ID
      tenantId: generateId('tnt'),
      name: input.name,
      slug: this.generateSlug(input.name),
      description: input.description,
      shortDescription: input.shortDescription,
      category: input.category,
      subcategory: input.subcategory,
      pricingModel: input.pricingModel,
      basePrice: input.basePrice,
      currentPrice: input.basePrice,
      currency: 'INR',
      goldWeight: input.goldWeight,
      purity: input.purity,
      metalType: input.metalType,
      laborCost: input.laborCost,
      makingCharges: input.makingCharges,
      stones: input.stones,
      specifications: input.specifications,
      stockQuantity: input.stockQuantity,
      stockStatus: input.stockQuantity > 5 ? 'in_stock' : input.stockQuantity > 0 ? 'low_stock' : 'out_of_stock',
      lowStockThreshold: 5,
      arEnabled: input.arEnabled || false,
      arModelUrl: null,
      images: [],
      video360Url: null,
      collections: [],
      tags: [],
      countries: input.countries,
      isActive: true,
      isVisible: true,
      viewCount: 0,
      purchaseCount: 0,
      wishlistCount: 0,
      averageRating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    productStore.set(productId, product);

    return product;
  }

  /**
   * Get seller's products
   */
  async getSellerProducts(
    userId: string,
    options: { category?: string; status?: string; page: number; limit: number }
  ): Promise<{ data: any[]; total: number }> {
    let products = Array.from(productStore.values()).filter(
      (p) => p.sellerId === userId && !p.isDeleted
    );

    if (options.category) {
      products = products.filter((p) => p.category === options.category);
    }

    if (options.status === 'active') {
      products = products.filter((p) => p.isActive);
    } else if (options.status === 'inactive') {
      products = products.filter((p) => !p.isActive);
    } else if (options.status === 'out_of_stock') {
      products = products.filter((p) => p.stockStatus === 'out_of_stock');
    }

    const total = products.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = products.slice(start, start + options.limit);

    return { data: paginatedData, total };
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string, userId: string): Promise<any> {
    const product = productStore.get(productId);

    if (!product || product.isDeleted) {
      throw new NotFoundError('Product');
    }

    if (product.sellerId !== userId) {
      throw new NotFoundError('Product');
    }

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, userId: string, updates: any): Promise<any> {
    const product = await this.getProduct(productId, userId);

    // Update allowed fields
    const allowedFields = [
      'name', 'description', 'shortDescription', 'category', 'subcategory',
      'pricingModel', 'basePrice', 'goldWeight', 'purity', 'metalType',
      'laborCost', 'makingCharges', 'stones', 'specifications', 'stockQuantity',
      'arEnabled', 'collections', 'tags', 'countries', 'isActive', 'isVisible',
      'metaTitle', 'metaDescription',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        product[field] = updates[field];
      }
    }

    // Update stock status
    if (updates.stockQuantity !== undefined) {
      product.stockStatus = updates.stockQuantity > 5 ? 'in_stock' : 
        updates.stockQuantity > 0 ? 'low_stock' : 'out_of_stock';
    }

    // Update slug if name changed
    if (updates.name) {
      product.slug = this.generateSlug(updates.name);
    }

    product.updatedAt = new Date();
    productStore.set(productId, product);

    return product;
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId: string, userId: string): Promise<void> {
    const product = await this.getProduct(productId, userId);

    product.isDeleted = true;
    product.deletedAt = new Date();
    product.updatedAt = new Date();

    productStore.set(productId, product);
  }

  /**
   * Upload product images
   */
  async uploadImages(
    productId: string,
    userId: string,
    files: Express.Multer.File[]
  ): Promise<any[]> {
    const product = await this.getProduct(productId, userId);

    const newImages = files.map((file, index) => ({
      id: generateId('img'),
      url: `https://storage.googleapis.com/grandgold-products/${productId}/${generateId('file')}.jpg`,
      alt: product.name,
      order: product.images.length + index,
      isPrimary: product.images.length === 0 && index === 0,
      type: 'main',
    }));

    product.images = [...product.images, ...newImages];
    product.updatedAt = new Date();
    productStore.set(productId, product);

    return newImages;
  }

  /**
   * Delete product image
   */
  async deleteImage(productId: string, imageId: string, userId: string): Promise<void> {
    const product = await this.getProduct(productId, userId);

    product.images = product.images.filter((img: any) => img.id !== imageId);
    product.updatedAt = new Date();
    productStore.set(productId, product);
  }

  /**
   * Upload AR model
   */
  async uploadArModel(
    productId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<{ url: string }> {
    const product = await this.getProduct(productId, userId);

    const arModelUrl = `https://storage.googleapis.com/grandgold-ar/${productId}/${generateId('model')}.glb`;

    product.arModelUrl = arModelUrl;
    product.arEnabled = true;
    product.updatedAt = new Date();
    productStore.set(productId, product);

    return { url: arModelUrl };
  }

  /**
   * Update stock
   */
  async updateStock(
    productId: string,
    userId: string,
    quantity: number,
    operation: 'set' | 'add' | 'subtract'
  ): Promise<any> {
    const product = await this.getProduct(productId, userId);

    let newQuantity: number;
    switch (operation) {
      case 'set':
        newQuantity = quantity;
        break;
      case 'add':
        newQuantity = product.stockQuantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.stockQuantity - quantity);
        break;
      default:
        newQuantity = quantity;
    }

    product.stockQuantity = newQuantity;
    product.stockStatus = newQuantity > 5 ? 'in_stock' : 
      newQuantity > 0 ? 'low_stock' : 'out_of_stock';
    product.updatedAt = new Date();
    productStore.set(productId, product);

    return product;
  }

  /**
   * Bulk import products
   */
  async bulkImport(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    // Parse CSV/Excel file (mock)
    // In production, use a library like csv-parser or xlsx

    return {
      imported: 10,
      failed: 2,
      errors: [
        'Row 5: Missing required field "name"',
        'Row 8: Invalid purity value "25K"',
      ],
    };
  }

  /**
   * Generate AI description
   */
  async generateAiDescription(productId: string, userId: string): Promise<string> {
    const product = await this.getProduct(productId, userId);

    // Mock AI description (in production, use Vertex AI)
    const description = `Exquisite ${product.purity || ''} ${product.metalType || 'gold'} ${product.category.slice(0, -1)}. ` +
      `This stunning piece weighs ${product.specifications?.weight || 'N/A'}g and features exceptional craftsmanship. ` +
      `Perfect for special occasions or as a treasured addition to your jewelry collection.`;

    return description;
  }

  private generateSku(category: string): string {
    const prefix = category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp}`;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
}
