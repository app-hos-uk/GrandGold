/**
 * GrandGold CMS Client
 * Integrates with Strapi headless CMS
 */

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337';
const CMS_TOKEN = process.env.STRAPI_API_TOKEN;

interface CMSFetchOptions {
  populate?: string | string[] | Record<string, any>;
  filters?: Record<string, any>;
  sort?: string | string[];
  pagination?: {
    page?: number;
    pageSize?: number;
    start?: number;
    limit?: number;
  };
  locale?: string;
}

interface CMSResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

async function cmsRequest<T>(
  endpoint: string,
  options?: CMSFetchOptions
): Promise<CMSResponse<T>> {
  const url = new URL(`/api${endpoint}`, CMS_URL);

  if (options) {
    if (options.populate) {
      if (typeof options.populate === 'string') {
        url.searchParams.set('populate', options.populate);
      } else if (Array.isArray(options.populate)) {
        options.populate.forEach((field, i) => {
          url.searchParams.set(`populate[${i}]`, field);
        });
      } else {
        url.searchParams.set('populate', JSON.stringify(options.populate));
      }
    }

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([op, val]) => {
            url.searchParams.set(`filters[${key}][${op}]`, String(val));
          });
        } else {
          url.searchParams.set(`filters[${key}]`, String(value));
        }
      });
    }

    if (options.sort) {
      const sortValue = Array.isArray(options.sort)
        ? options.sort.join(',')
        : options.sort;
      url.searchParams.set('sort', sortValue);
    }

    if (options.pagination) {
      Object.entries(options.pagination).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(`pagination[${key}]`, String(value));
        }
      });
    }

    if (options.locale) {
      url.searchParams.set('locale', options.locale);
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (CMS_TOKEN) {
    headers['Authorization'] = `Bearer ${CMS_TOKEN}`;
  }

  const response = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 }, // ISR - revalidate every 60 seconds
  });

  if (!response.ok) {
    throw new Error(`CMS request failed: ${response.status}`);
  }

  return response.json();
}

// ============ Homepage ============

export interface Homepage {
  id: number;
  attributes: {
    heroTitle: string;
    heroSubtitle?: string;
    heroImage?: CMSMedia;
    heroCTA?: CTAButton;
    featuredCollections?: { data: CollectionPage[] };
    trustBadges?: TrustBadge[];
    testimonials?: Testimonial[];
    seo?: SEO;
  };
}

export async function getHomepage(locale = 'en'): Promise<Homepage | null> {
  try {
    const response = await cmsRequest<Homepage>('/homepage', {
      populate: '*',
      locale,
    });
    return response.data;
  } catch {
    return null;
  }
}

// ============ Banners ============

export interface Banner {
  id: number;
  attributes: {
    title: string;
    subtitle?: string;
    image: CMSMedia;
    mobileImage?: CMSMedia;
    link?: string;
    linkText?: string;
    placement: string;
    country: string;
    startDate?: string;
    endDate?: string;
    priority: number;
    isActive: boolean;
  };
}

export async function getBanners(
  placement: string,
  country = 'all',
  locale = 'en'
): Promise<Banner[]> {
  try {
    const now = new Date().toISOString();
    const response = await cmsRequest<Banner[]>('/banners', {
      populate: ['image', 'mobileImage'],
      filters: {
        placement: { $eq: placement },
        isActive: { $eq: true },
        $or: [
          { country: { $eq: 'all' } },
          { country: { $eq: country } },
        ],
        $and: [
          { $or: [{ startDate: { $lte: now } }, { startDate: { $null: true } }] },
          { $or: [{ endDate: { $gte: now } }, { endDate: { $null: true } }] },
        ],
      },
      sort: 'priority:desc',
      locale,
    });
    return response.data || [];
  } catch {
    return [];
  }
}

// ============ FAQs ============

export interface FAQ {
  id: number;
  attributes: {
    question: string;
    answer: string;
    category: string;
    country: string;
    priority: number;
  };
}

export async function getFAQs(
  category?: string,
  country = 'all',
  locale = 'en'
): Promise<FAQ[]> {
  try {
    const filters: Record<string, any> = {
      $or: [{ country: { $eq: 'all' } }, { country: { $eq: country } }],
    };

    if (category) {
      filters.category = { $eq: category };
    }

    const response = await cmsRequest<FAQ[]>('/faqs', {
      filters,
      sort: 'priority:desc',
      locale,
    });
    return response.data || [];
  } catch {
    return [];
  }
}

// ============ Blog Posts ============

export interface BlogPost {
  id: number;
  attributes: {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featuredImage: CMSMedia;
    author: string;
    category: string;
    tags?: string[];
    readTime?: number;
    seo?: SEO;
    publishedAt: string;
  };
}

export async function getBlogPosts(
  category?: string,
  limit = 10,
  locale = 'en'
): Promise<BlogPost[]> {
  try {
    const filters: Record<string, any> = {};
    if (category) {
      filters.category = { $eq: category };
    }

    const response = await cmsRequest<BlogPost[]>('/blog-posts', {
      populate: ['featuredImage', 'seo.ogImage'],
      filters,
      sort: 'publishedAt:desc',
      pagination: { limit },
      locale,
    });
    return response.data || [];
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(
  slug: string,
  locale = 'en'
): Promise<BlogPost | null> {
  try {
    const response = await cmsRequest<BlogPost[]>('/blog-posts', {
      populate: ['featuredImage', 'seo.ogImage'],
      filters: { slug: { $eq: slug } },
      locale,
    });
    return response.data?.[0] || null;
  } catch {
    return null;
  }
}

// ============ Legal Pages ============

export interface LegalPage {
  id: number;
  attributes: {
    title: string;
    slug: string;
    type: string;
    content: string;
    country: string;
    version?: string;
    effectiveDate: string;
    seo?: SEO;
  };
}

export async function getLegalPage(
  type: string,
  country = 'all',
  locale = 'en'
): Promise<LegalPage | null> {
  try {
    const response = await cmsRequest<LegalPage[]>('/legal-pages', {
      populate: ['seo.ogImage'],
      filters: {
        type: { $eq: type },
        $or: [{ country: { $eq: 'all' } }, { country: { $eq: country } }],
      },
      sort: 'effectiveDate:desc',
      pagination: { limit: 1 },
      locale,
    });
    return response.data?.[0] || null;
  } catch {
    return null;
  }
}

// ============ Announcements ============

export interface Announcement {
  id: number;
  attributes: {
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'promotion';
    link?: string;
    linkText?: string;
    placement: string;
    country: string;
    dismissible: boolean;
    priority: number;
  };
}

export async function getAnnouncements(
  placement: string,
  country = 'all',
  locale = 'en'
): Promise<Announcement[]> {
  try {
    const now = new Date().toISOString();
    const response = await cmsRequest<Announcement[]>('/announcements', {
      filters: {
        placement: { $eq: placement },
        $or: [{ country: { $eq: 'all' } }, { country: { $eq: country } }],
        $and: [
          { $or: [{ startDate: { $lte: now } }, { startDate: { $null: true } }] },
          { $or: [{ endDate: { $gte: now } }, { endDate: { $null: true } }] },
        ],
      },
      sort: 'priority:desc',
      locale,
    });
    return response.data || [];
  } catch {
    return [];
  }
}

// ============ Metal Education ============

export interface MetalEducation {
  id: number;
  attributes: {
    title: string;
    slug: string;
    description?: string;
    content: string;
    metalType: string;
    category: string;
    featuredImage?: CMSMedia;
    videoUrl?: string;
    relatedArticles?: { data: MetalEducation[] };
    seo?: SEO;
  };
}

export async function getMetalEducation(
  metalType?: string,
  category?: string,
  locale = 'en'
): Promise<MetalEducation[]> {
  try {
    const filters: Record<string, any> = {};
    if (metalType) filters.metalType = { $eq: metalType };
    if (category) filters.category = { $eq: category };

    const response = await cmsRequest<MetalEducation[]>('/metal-educations', {
      populate: ['featuredImage', 'seo.ogImage'],
      filters,
      locale,
    });
    return response.data || [];
  } catch {
    return [];
  }
}

export async function getMetalEducationBySlug(
  slug: string,
  locale = 'en'
): Promise<MetalEducation | null> {
  try {
    const response = await cmsRequest<MetalEducation[]>('/metal-educations', {
      populate: ['featuredImage', 'relatedArticles', 'seo.ogImage'],
      filters: { slug: { $eq: slug } },
      locale,
    });
    return response.data?.[0] || null;
  } catch {
    return null;
  }
}

// ============ Collection Pages ============

export interface CollectionPage {
  id: number;
  attributes: {
    name: string;
    slug: string;
    description?: string;
    heroImage?: CMSMedia;
    bannerImage?: CMSMedia;
    collectionId: string;
    promotionalText?: string;
    features?: FeatureItem[];
    seo?: SEO;
  };
}

export async function getCollectionPage(
  slug: string,
  locale = 'en'
): Promise<CollectionPage | null> {
  try {
    const response = await cmsRequest<CollectionPage[]>('/collection-pages', {
      populate: ['heroImage', 'bannerImage', 'features', 'seo.ogImage'],
      filters: { slug: { $eq: slug } },
      locale,
    });
    return response.data?.[0] || null;
  } catch {
    return null;
  }
}

// ============ Shared Types ============

interface CMSMedia {
  data: {
    id: number;
    attributes: {
      url: string;
      alternativeText?: string;
      width: number;
      height: number;
      formats?: {
        thumbnail?: { url: string };
        small?: { url: string };
        medium?: { url: string };
        large?: { url: string };
      };
    };
  } | null;
}

interface SEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogImage?: CMSMedia;
  structuredData?: Record<string, any>;
}

interface CTAButton {
  text: string;
  link: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  openInNewTab: boolean;
}

interface TrustBadge {
  title: string;
  description?: string;
  icon?: CMSMedia;
  iconName?: string;
}

interface Testimonial {
  name: string;
  role?: string;
  avatar?: CMSMedia;
  content: string;
  rating?: number;
  country?: string;
}

interface FeatureItem {
  title: string;
  description?: string;
  icon?: CMSMedia;
  iconName?: string;
}

// ============ Utility Functions ============

/**
 * Get the full URL for a CMS media file
 */
export function getCMSImageUrl(media?: CMSMedia, size?: 'thumbnail' | 'small' | 'medium' | 'large'): string | null {
  if (!media?.data?.attributes) return null;

  const { url, formats } = media.data.attributes;

  if (size && formats?.[size]) {
    return `${CMS_URL}${formats[size].url}`;
  }

  return `${CMS_URL}${url}`;
}
