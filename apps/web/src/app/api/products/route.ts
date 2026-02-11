import { NextRequest, NextResponse } from 'next/server';

const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:4007';

/**
 * Proxy /api/products to product-service so the client's Authorization header
 * is forwarded (Next.js rewrites do not forward headers when fetching the destination).
 */
async function proxy(request: NextRequest, path = '') {
  const url = `${PRODUCT_SERVICE_URL}/api/products${path}${request.nextUrl.search}`;
  const auth = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');

  const headers: HeadersInit = {};
  if (auth) headers['Authorization'] = auth;
  if (contentType) headers['Content-Type'] = contentType;

  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    // no body
  }

  const res = await fetch(url, {
    method: request.method,
    headers,
    body: body && body.length > 0 ? body : undefined,
    duplex: 'half',
  } as RequestInit);

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}
