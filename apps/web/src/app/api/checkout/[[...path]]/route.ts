import { NextRequest, NextResponse } from 'next/server';

const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004';

/**
 * Proxy /api/checkout and /api/checkout/* to order-service.
 * The order-service mounts the checkout router at /api/checkout.
 * This proxy forwards the Authorization header (injected by middleware from
 * httpOnly cookies) so the backend can identify the user.
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
  const url = `${ORDER_SERVICE_URL}/api/checkout${path}${request.nextUrl.search}`;
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
