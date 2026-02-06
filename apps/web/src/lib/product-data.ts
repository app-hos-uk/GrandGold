/**
 * Mock Product Data - Easily editable product catalog
 * 
 * To update products:
 * 1. Edit this file directly to add/modify/remove products
 * 2. Changes will be reflected across the app (homepage, AI chat, etc.)
 * 3. For production, replace with API calls to the product-service
 */

export interface MockProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  description: string;
  price: number;
  currency: 'INR' | 'AED' | 'GBP';
  weight: string;
  purity: string;
  metalType: 'gold' | 'silver' | 'platinum' | 'white_gold' | 'rose_gold';
  inStock: boolean;
  stockQuantity: number;
  images: string[];
  tags: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  countries: ('IN' | 'AE' | 'UK')[];
}

/**
 * EDITABLE MOCK PRODUCTS
 * Add, modify, or remove products below. Changes reflect immediately in development.
 */
export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: '1',
    name: 'Traditional Kundan Necklace Set',
    slug: 'traditional-kundan-necklace-set',
    category: 'Necklaces',
    subcategory: 'Bridal',
    description: 'Exquisite handcrafted Kundan necklace set featuring intricate meenakari work, perfect for weddings and special occasions. Comes with matching earrings.',
    price: 185000,
    currency: 'INR',
    weight: '45.5g',
    purity: '22K',
    metalType: 'gold',
    inStock: true,
    stockQuantity: 12,
    images: ['/products/kundan-necklace-1.jpg'],
    tags: ['kundan', 'bridal', 'wedding', 'necklace', 'traditional'],
    featured: true,
    bestseller: true,
    newArrival: false,
    countries: ['IN', 'AE', 'UK'],
  },
  {
    id: '2',
    name: 'Diamond Studded Jhumkas',
    slug: 'diamond-studded-jhumkas',
    category: 'Earrings',
    subcategory: 'Jhumkas',
    description: 'Classic South Indian jhumka earrings adorned with brilliant-cut diamonds. A timeless piece that adds elegance to any outfit.',
    price: 78500,
    currency: 'INR',
    weight: '12.3g',
    purity: '18K',
    metalType: 'gold',
    inStock: true,
    stockQuantity: 25,
    images: ['/products/diamond-jhumkas-1.jpg'],
    tags: ['diamond', 'jhumkas', 'earrings', 'south indian', 'traditional'],
    featured: true,
    bestseller: false,
    newArrival: true,
    countries: ['IN', 'AE'],
  },
  {
    id: '3',
    name: 'Solitaire Engagement Ring',
    slug: 'solitaire-engagement-ring',
    category: 'Rings',
    subcategory: 'Engagement',
    description: 'Stunning 1-carat VS1 clarity solitaire diamond ring set in 18K white gold. The perfect symbol of eternal love.',
    price: 245000,
    currency: 'INR',
    weight: '8.2g',
    purity: '18K',
    metalType: 'white_gold',
    inStock: true,
    stockQuantity: 8,
    images: ['/products/solitaire-ring-1.jpg'],
    tags: ['solitaire', 'diamond', 'engagement', 'ring', 'white gold'],
    featured: true,
    bestseller: true,
    newArrival: false,
    countries: ['IN', 'AE', 'UK'],
  },
  {
    id: '4',
    name: 'Classic Gold Bangle Set',
    slug: 'classic-gold-bangle-set',
    category: 'Bangles',
    subcategory: 'Traditional',
    description: 'Set of 4 beautifully crafted 22K gold bangles with intricate filigree work. Perfect for daily wear or festive occasions.',
    price: 125000,
    currency: 'INR',
    weight: '35.0g',
    purity: '22K',
    metalType: 'gold',
    inStock: true,
    stockQuantity: 18,
    images: ['/products/gold-bangles-1.jpg'],
    tags: ['bangles', 'traditional', 'filigree', 'daily wear'],
    featured: false,
    bestseller: true,
    newArrival: false,
    countries: ['IN', 'AE'],
  },
  {
    id: '5',
    name: 'Temple Design Choker',
    slug: 'temple-design-choker',
    category: 'Necklaces',
    subcategory: 'Temple Jewelry',
    description: 'Magnificent temple-style choker necklace featuring goddess motifs and ruby accents. A statement piece for grand celebrations.',
    price: 295000,
    currency: 'INR',
    weight: '58.2g',
    purity: '22K',
    metalType: 'gold',
    inStock: false,
    stockQuantity: 0,
    images: ['/products/temple-choker-1.jpg'],
    tags: ['temple', 'choker', 'bridal', 'antique', 'ruby'],
    featured: true,
    bestseller: false,
    newArrival: false,
    countries: ['IN'],
  },
  {
    id: '6',
    name: 'Pearl Drop Earrings',
    slug: 'pearl-drop-earrings',
    category: 'Earrings',
    subcategory: 'Drop Earrings',
    description: 'Elegant 18K gold earrings featuring natural freshwater pearls. A sophisticated choice for office or evening wear.',
    price: 45000,
    currency: 'INR',
    weight: '8.5g',
    purity: '18K',
    metalType: 'gold',
    inStock: true,
    stockQuantity: 30,
    images: ['/products/pearl-earrings-1.jpg'],
    tags: ['pearl', 'drop', 'earrings', 'elegant', 'office wear'],
    featured: false,
    bestseller: false,
    newArrival: true,
    countries: ['IN', 'AE', 'UK'],
  },
  {
    id: '7',
    name: 'Diamond Eternity Band',
    slug: 'diamond-eternity-band',
    category: 'Rings',
    subcategory: 'Bands',
    description: 'Sparkling eternity band with 2 carats of pave-set diamonds around the entire band. Symbol of never-ending love.',
    price: 165000,
    currency: 'INR',
    weight: '5.8g',
    purity: '18K',
    metalType: 'white_gold',
    inStock: true,
    stockQuantity: 15,
    images: ['/products/eternity-band-1.jpg'],
    tags: ['diamond', 'eternity', 'band', 'wedding', 'anniversary'],
    featured: false,
    bestseller: true,
    newArrival: false,
    countries: ['IN', 'AE', 'UK'],
  },
  {
    id: '8',
    name: 'Gold Charm Bracelet',
    slug: 'gold-charm-bracelet',
    category: 'Bracelets',
    subcategory: 'Charm',
    description: 'Delightful 22K gold charm bracelet with 5 customizable charms. Add your own story with additional charms.',
    price: 55000,
    currency: 'INR',
    weight: '15.2g',
    purity: '22K',
    metalType: 'gold',
    inStock: true,
    stockQuantity: 22,
    images: ['/products/charm-bracelet-1.jpg'],
    tags: ['charm', 'bracelet', 'customizable', 'gift'],
    featured: false,
    bestseller: false,
    newArrival: true,
    countries: ['IN', 'AE', 'UK'],
  },
  {
    id: '9',
    name: 'Platinum Wedding Band',
    slug: 'platinum-wedding-band',
    category: 'Rings',
    subcategory: 'Wedding Bands',
    description: 'Classic platinum wedding band with brushed center and polished edges. Durable and timeless.',
    price: 85000,
    currency: 'INR',
    weight: '10.5g',
    purity: '950',
    metalType: 'platinum',
    inStock: true,
    stockQuantity: 20,
    images: ['/products/platinum-band-1.jpg'],
    tags: ['platinum', 'wedding', 'band', 'men', 'couple'],
    featured: false,
    bestseller: false,
    newArrival: false,
    countries: ['IN', 'AE', 'UK'],
  },
  {
    id: '10',
    name: 'Rose Gold Heart Pendant',
    slug: 'rose-gold-heart-pendant',
    category: 'Pendants',
    subcategory: 'Fashion',
    description: 'Beautiful rose gold heart pendant with delicate diamond accents. Perfect gift for loved ones.',
    price: 35000,
    currency: 'INR',
    weight: '4.2g',
    purity: '18K',
    metalType: 'rose_gold',
    inStock: true,
    stockQuantity: 35,
    images: ['/products/heart-pendant-1.jpg'],
    tags: ['rose gold', 'heart', 'pendant', 'gift', 'diamond'],
    featured: true,
    bestseller: true,
    newArrival: true,
    countries: ['IN', 'AE', 'UK'],
  },
];

/**
 * Legacy product display map for backward compatibility
 */
export const productDisplayMap: Record<string, { name: string; category: string; price: number; weight: string; purity: string; inStock: boolean }> = 
  Object.fromEntries(
    MOCK_PRODUCTS.map(p => [p.id, {
      name: p.name,
      category: p.category,
      price: p.price,
      weight: p.weight,
      purity: p.purity,
      inStock: p.inStock,
    }])
  );

/**
 * Helper functions for product data
 */
export function getProductById(id: string): MockProduct | undefined {
  return MOCK_PRODUCTS.find(p => p.id === id);
}

export function getProductsByCategory(category: string): MockProduct[] {
  return MOCK_PRODUCTS.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

export function getFeaturedProducts(): MockProduct[] {
  return MOCK_PRODUCTS.filter(p => p.featured && p.inStock);
}

export function getBestsellers(): MockProduct[] {
  return MOCK_PRODUCTS.filter(p => p.bestseller && p.inStock);
}

export function getNewArrivals(): MockProduct[] {
  return MOCK_PRODUCTS.filter(p => p.newArrival && p.inStock);
}

export function searchProducts(query: string): MockProduct[] {
  const q = query.toLowerCase();
  return MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
}

/* ------------------------------------------------------------------ */
/*  Fuzzy search helpers (for search bar autocomplete & typo handling)  */
/* ------------------------------------------------------------------ */

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** All searchable terms (product names, categories, tags, subcategories) */
function getAllSearchTerms(): string[] {
  const terms = new Set<string>();
  MOCK_PRODUCTS.forEach((p) => {
    terms.add(p.name.toLowerCase());
    terms.add(p.category.toLowerCase());
    if (p.subcategory) terms.add(p.subcategory.toLowerCase());
    p.tags.forEach((t) => terms.add(t.toLowerCase()));
  });
  // Add common jewelry terms
  ['gold', 'diamond', 'platinum', 'silver', 'rose gold', 'white gold',
   'necklace', 'earring', 'ring', 'bangle', 'bracelet', 'pendant',
   'jhumka', 'choker', 'chain', 'stud', 'solitaire', 'kundan',
   'bridal', 'wedding', 'engagement', 'anniversary', 'birthday',
   '22k', '18k', '24k', 'hallmark', 'certified',
  ].forEach((t) => terms.add(t));
  return [...terms];
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'tag' | 'correction';
  product?: MockProduct;
  categorySlug?: string;
}

/** Get autocomplete suggestions as user types */
export function getSearchSuggestions(query: string): SearchSuggestion[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Exact product matches (name contains query)
  MOCK_PRODUCTS.forEach((p) => {
    if (p.name.toLowerCase().includes(q) && !seen.has(p.id)) {
      seen.add(p.id);
      suggestions.push({ text: p.name, type: 'product', product: p });
    }
  });

  // 2. Category matches
  const categories = [...new Set(MOCK_PRODUCTS.map((p) => p.category))];
  categories.forEach((cat) => {
    if (cat.toLowerCase().includes(q) && !seen.has(`cat:${cat}`)) {
      seen.add(`cat:${cat}`);
      suggestions.push({ text: cat, type: 'category', categorySlug: cat.toLowerCase() });
    }
  });

  // 3. Tag / subcategory matches
  MOCK_PRODUCTS.forEach((p) => {
    p.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(q) && !seen.has(`tag:${tag}`)) {
        seen.add(`tag:${tag}`);
        suggestions.push({ text: tag, type: 'tag' });
      }
    });
    if (p.subcategory && p.subcategory.toLowerCase().includes(q) && !seen.has(`sub:${p.subcategory}`)) {
      seen.add(`sub:${p.subcategory}`);
      suggestions.push({ text: p.subcategory, type: 'category' });
    }
  });

  // 4. Description keyword matches (products whose description contains query)
  MOCK_PRODUCTS.forEach((p) => {
    if (p.description.toLowerCase().includes(q) && !seen.has(p.id)) {
      seen.add(p.id);
      suggestions.push({ text: p.name, type: 'product', product: p });
    }
  });

  return suggestions.slice(0, 8);
}

/** Fuzzy search - find closest match when no exact match exists (misspelling correction) */
export function fuzzyCorrect(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (q.length < 3) return null;

  const allTerms = getAllSearchTerms();
  // Check if we already have exact matches
  const exactExists = allTerms.some((t) => t.includes(q) || q.includes(t));
  if (exactExists) return null;

  // Find the closest word per query token
  const tokens = q.split(/\s+/);
  const corrected: string[] = [];
  let anyCorrection = false;

  for (const token of tokens) {
    if (token.length < 3) {
      corrected.push(token);
      continue;
    }
    let bestMatch = token;
    let bestDist = Infinity;
    for (const term of allTerms) {
      // Compare token against each word in the term
      const termWords = term.split(/\s+/);
      for (const tw of termWords) {
        if (tw.length < 3) continue;
        const dist = levenshtein(token, tw);
        const threshold = token.length <= 4 ? 1 : 2;
        if (dist <= threshold && dist < bestDist) {
          bestDist = dist;
          bestMatch = tw;
        }
      }
    }
    if (bestMatch !== token) anyCorrection = true;
    corrected.push(bestMatch);
  }

  return anyCorrection ? corrected.join(' ') : null;
}

/** Full fuzzy search: returns results + optional "did you mean" correction */
export function fuzzySearchProducts(query: string): { results: MockProduct[]; correction: string | null } {
  const directResults = searchProducts(query);
  if (directResults.length > 0) return { results: directResults, correction: null };

  const correction = fuzzyCorrect(query);
  if (correction) {
    const correctedResults = searchProducts(correction);
    return { results: correctedResults, correction };
  }

  return { results: [], correction: null };
}

export function getProductsForCountry(country: 'IN' | 'AE' | 'UK'): MockProduct[] {
  return MOCK_PRODUCTS.filter(p => p.countries.includes(country) && p.inStock);
}

/**
 * Get product context for AI chat
 */
export function getProductContextForAI(): string {
  const categories = [...new Set(MOCK_PRODUCTS.map(p => p.category))];
  const priceRange = {
    min: Math.min(...MOCK_PRODUCTS.map(p => p.price)),
    max: Math.max(...MOCK_PRODUCTS.map(p => p.price)),
  };
  
  return `
Available product categories: ${categories.join(', ')}.
Price range: ₹${priceRange.min.toLocaleString('en-IN')} to ₹${priceRange.max.toLocaleString('en-IN')}.
Featured products: ${getFeaturedProducts().map(p => p.name).join(', ')}.
Bestsellers: ${getBestsellers().map(p => p.name).join(', ')}.
New arrivals: ${getNewArrivals().map(p => p.name).join(', ')}.
Total products available: ${MOCK_PRODUCTS.filter(p => p.inStock).length}.
  `.trim();
}
