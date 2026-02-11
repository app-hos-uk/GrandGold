import { NextRequest, NextResponse } from 'next/server';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:4005';

/**
 * Proxy /api/payments and /api/payments/* to payment-service so the client's
 * Authorization header is forwarded (Next.js rewrites do not forward headers).
 * Fixes "Invalid token or expired token" on Refunds (GET /api/payments/refunds, etc.).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path;
  const pathStr = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '';
  return proxy(request, pathStr);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path;
  const pathStr = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '';
  return proxy(request, pathStr);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path;
  const pathStr = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '';
  return proxy(request, pathStr);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path;
  const pathStr = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '';
  return proxy(request, pathStr);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path;
  const pathStr = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '';
  return proxy(request, pathStr);
}

async function proxy(request: NextRequest, path: string) {
  const url = `${PAYMENT_SERVICE_URL}/api/payments${path}${request.nextUrl.search}`;
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
