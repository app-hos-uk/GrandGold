import { NotFoundError } from '@grandgold/utils';
import type { Country } from '@grandgold/types';

// Note: This service doesn't use Redis currently, just in-memory data

export class CollectionService {
  /**
   * Get collections
   */
  async getCollections(country: Country): Promise<any[]> {
    // In production, fetch from database
    const collections = [
      {
        id: 'col_traditional_indian_bridal',
        name: 'Traditional Indian Bridal',
        slug: 'traditional-indian-bridal',
        description: 'Exquisite bridal jewelry collection',
        image: 'https://example.com/collections/traditional-bridal.jpg',
        countries: ['IN', 'AE', 'UK'],
        productCount: 45,
      },
      {
        id: 'col_contemporary_minimalist',
        name: 'Contemporary Minimalist',
        slug: 'contemporary-minimalist',
        description: 'Modern minimalist designs',
        image: 'https://example.com/collections/minimalist.jpg',
        countries: ['IN', 'AE', 'UK'],
        productCount: 32,
      },
      {
        id: 'col_middle_eastern_ornate',
        name: 'Middle Eastern Ornate',
        slug: 'middle-eastern-ornate',
        description: 'Luxurious ornate designs',
        image: 'https://example.com/collections/ornate.jpg',
        countries: ['IN', 'AE', 'UK'],
        productCount: 28,
      },
    ];

    return collections.filter((c) => c.countries.includes(country));
  }

  /**
   * Get collection
   */
  async getCollection(collectionId: string, country: Country): Promise<any> {
    const collections = await this.getCollections(country);
    const collection = collections.find((c) => c.id === collectionId);

    if (!collection) {
      throw new NotFoundError('Collection');
    }

    // In production, fetch products for collection
    collection.products = [];

    return collection;
  }
}
