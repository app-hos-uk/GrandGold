import { NotFoundError, ValidationError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';
import { ProductService } from './product.service';
import type { Product, ProductComparison, ComparisonField } from '../types/product.types';

const MAX_COMPARE_ITEMS = 4;
const productService = new ProductService();

export class ComparisonService {
  /**
   * Compare up to 4 products
   */
  async compareProducts(
    productIds: string[],
    country: Country
  ): Promise<ProductComparison> {
    if (productIds.length < 2 || productIds.length > MAX_COMPARE_ITEMS) {
      throw new ValidationError(`Provide 2-${MAX_COMPARE_ITEMS} product IDs to compare`);
    }

    const uniqueIds = [...new Set(productIds)];
    const products: Product[] = [];

    for (const id of uniqueIds) {
      try {
        const product = await productService.getProduct(id, country);
        products.push(product);
      } catch {
        throw new NotFoundError(`Product ${id}`);
      }
    }

    const comparison: Record<string, { label: string; values: Record<string, string | number | boolean> }> = {
      name: { label: 'Name', values: {} },
      price: { label: 'Price', values: {} },
      category: { label: 'Category', values: {} },
      purity: { label: 'Purity', values: {} },
      goldWeight: { label: 'Gold Weight (g)', values: {} },
      stock: { label: 'In Stock', values: {} },
      arEnabled: { label: 'AR Try-On', values: {} },
      averageRating: { label: 'Rating', values: {} },
    };

    products.forEach((p) => {
      const id = p.id;
      comparison.name.values[id] = p.name || '-';
      comparison.price.values[id] = p.price ?? p.currentPrice ?? 0;
      comparison.category.values[id] = p.category || '-';
      comparison.purity.values[id] = p.purity || '-';
      comparison.goldWeight.values[id] = p.goldWeight ?? '-';
      comparison.stock.values[id] = p.stock > 0;
      comparison.arEnabled.values[id] = p.arEnabled || false;
      comparison.averageRating.values[id] = p.averageRating ?? 0;
    });

    return { products, comparison };
  }
}
