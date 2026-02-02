import { NextRequest, NextResponse } from 'next/server';

// Supported countries and their paths
const SUPPORTED_COUNTRIES = ['in', 'ae', 'uk'] as const;
type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

// Country detection based on various factors
function detectCountry(request: NextRequest): SupportedCountry {
  // 1. Check URL path first
  const pathname = request.nextUrl.pathname;
  for (const country of SUPPORTED_COUNTRIES) {
    if (pathname.startsWith(`/${country}`)) {
      return country;
    }
  }

  // 2. Check cookie for user preference
  const countryCookie = request.cookies.get('country')?.value as SupportedCountry;
  if (countryCookie && SUPPORTED_COUNTRIES.includes(countryCookie)) {
    return countryCookie;
  }

  // 3. Check Cloudflare/GCP geolocation headers
  const cfCountry = request.headers.get('cf-ipcountry');
  const gcpCountry = request.headers.get('x-appengine-country');
  const geoCountry = cfCountry || gcpCountry;

  if (geoCountry) {
    switch (geoCountry.toUpperCase()) {
      case 'IN':
        return 'in';
      case 'AE':
        return 'ae';
      case 'GB':
      case 'UK':
        return 'uk';
    }
  }

  // 4. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';
  if (acceptLanguage.includes('en-IN')) return 'in';
  if (acceptLanguage.includes('ar-AE') || acceptLanguage.includes('en-AE')) return 'ae';
  if (acceptLanguage.includes('en-GB')) return 'uk';

  // Default to India
  return 'in';
}

// Paths that don't need country prefix
const PUBLIC_PATHS = [
  '/api',
  '/_next',
  '/static',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/sw.js',
  '/workbox-',
  '/admin',
  '/seller',
];

// Check if path is public
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

// Check if path has country prefix
function hasCountryPrefix(pathname: string): boolean {
  return SUPPORTED_COUNTRIES.some((country) => 
    pathname === `/${country}` || pathname.startsWith(`/${country}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // If already has country prefix, continue
  if (hasCountryPrefix(pathname)) {
    // Extract country and set header for downstream use
    const country = pathname.split('/')[1] as SupportedCountry;
    const response = NextResponse.next();
    response.headers.set('x-grandgold-country', country);
    
    // Set cookie if not set
    if (!request.cookies.has('country')) {
      response.cookies.set('country', country, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
    }
    
    return response;
  }

  // Detect country and redirect
  const detectedCountry = detectCountry(request);
  
  // Build new URL with country prefix
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = `/${detectedCountry}${pathname === '/' ? '' : pathname}`;

  // Redirect to country-specific URL
  const response = NextResponse.redirect(newUrl);
  response.cookies.set('country', detectedCountry, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
