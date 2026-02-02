/**
 * Shared product display data for wishlist/category when API doesn't return full product details
 */
export const productDisplayMap: Record<string, { name: string; category: string; price: number; weight: string; purity: string; inStock: boolean }> = {
  '1': { name: 'Traditional Kundan Necklace Set', category: 'Necklaces', price: 185000, weight: '45.5g', purity: '22K', inStock: true },
  '2': { name: 'Diamond Studded Jhumkas', category: 'Earrings', price: 78500, weight: '12.3g', purity: '18K', inStock: true },
  '3': { name: 'Solitaire Engagement Ring', category: 'Rings', price: 245000, weight: '8.2g', purity: '18K', inStock: true },
  '4': { name: 'Classic Gold Bangle Set', category: 'Bracelets', price: 125000, weight: '35.0g', purity: '22K', inStock: true },
  '5': { name: 'Temple Design Choker', category: 'Necklaces', price: 295000, weight: '58.2g', purity: '22K', inStock: false },
  '6': { name: 'Pearl Drop Earrings', category: 'Earrings', price: 45000, weight: '8.5g', purity: '18K', inStock: true },
  '7': { name: 'Diamond Eternity Band', category: 'Rings', price: 165000, weight: '5.8g', purity: '18K', inStock: true },
  '8': { name: 'Charm Bracelet', category: 'Bracelets', price: 55000, weight: '15.2g', purity: '22K', inStock: true },
};
