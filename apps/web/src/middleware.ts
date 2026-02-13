import { NextRequest, NextResponse } from 'next/server';

// ─── Country routing ──────────────────────────────────────────────────────────
const SUPPORTED_COUNTRIES = ['in', 'ae', 'uk'] as const;
type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

function detectCountry(request: NextRequest): SupportedCountry {
  const pathname = request.nextUrl.pathname;
  for (const country of SUPPORTED_COUNTRIES) {
    if (pathname.startsWith(`/${country}`)) return country;
  }
  const countryCookie = request.cookies.get('country')?.value?.toLowerCase() as SupportedCountry;
  if (countryCookie && SUPPORTED_COUNTRIES.includes(countryCookie)) return countryCookie;
  return 'in';
}

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

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function hasCountryPrefix(pathname: string): boolean {
  return SUPPORTED_COUNTRIES.some((c) => pathname === `/${c}` || pathname.startsWith(`/${c}/`));
}

// ─── CSP nonce helper ─────────────────────────────────────────────────────────
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// ─── Middleware ────────────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API paths: inject httpOnly cookie token into Authorization header ──────
  if (pathname.startsWith('/api/')) {
    const accessToken = request.cookies.get('gg_access_token')?.value;
    const hasAuthHeader = request.headers.get('authorization');

    if (accessToken && !hasAuthHeader) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    return NextResponse.next();
  }

  // ── Generate CSP nonce for page responses ──────────────────────────────────
  const nonce = generateNonce();

  // Build Content-Security-Policy
  // Tailwind uses inline styles, so style-src 'unsafe-inline' is necessary.
  // Scripts are nonce-gated except for 'self'.
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`, // Tailwind & Framer Motion need inline styles
    `img-src 'self' data: blob: https://storage.googleapis.com https://lh3.googleusercontent.com https://platform-lookaside.fbsbx.com`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.googleapis.com https://*.razorpay.com https://*.stripe.com`,
    `frame-src 'self' https://*.stripe.com https://*.razorpay.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  // Helper: create NextResponse.next() with nonce in both request & response headers
  const nextWithCsp = (extraRequestHeaders?: Record<string, string>) => {
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set('x-nonce', nonce);
    if (extraRequestHeaders) {
      Object.entries(extraRequestHeaders).forEach(([k, v]) => reqHeaders.set(k, v));
    }
    const response = NextResponse.next({ request: { headers: reqHeaders } });
    response.headers.set('x-nonce', nonce);
    response.headers.set('Content-Security-Policy', csp);
    return response;
  };

  // ── Non-country paths ──────────────────────────────────────────────────────
  if (isPublicPath(pathname)) {
    return nextWithCsp();
  }

  // ── Country-prefixed paths ─────────────────────────────────────────────────
  if (hasCountryPrefix(pathname)) {
    const country = pathname.split('/')[1] as SupportedCountry;
    const response = nextWithCsp({ 'x-grandgold-country': country });

    if (!request.cookies.has('country')) {
      response.cookies.set('country', country, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    return response;
  }

  // ── Redirect to country-prefixed URL ───────────────────────────────────────
  const detectedCountry = detectCountry(request);
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = `/${detectedCountry}${pathname === '/' ? '' : pathname}`;

  const response = NextResponse.redirect(newUrl);
  response.cookies.set('country', detectedCountry, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
