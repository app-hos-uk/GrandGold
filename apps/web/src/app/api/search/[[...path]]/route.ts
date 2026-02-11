import { NextRequest, NextResponse } from 'next/server';

const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:4007';

/**
 * Proxy /api/search and /api/search/admin to product-service so the client's
 * Authorization header is forwarded (required for admin product list and stats).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path;
  const pathStr = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '';
  return proxy(request, pathStr);
}

async function proxy(request: NextRequest, path: string) {
  const url = `${PRODUCT_SERVICE_URL}/api/search${path}${request.nextUrl.search}`;
  const auth = request.headers.get('authorization');

  const headers: HeadersInit = {};
  if (auth) headers['Authorization'] = auth;

  const res = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
