import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001';

/**
 * Proxy /api/user and /api/user/* to auth-service so the client's
 * Authorization header is forwarded (Next.js rewrites do not forward headers).
 * Ensures admin list (e.g. role=seller for Sellers page) and other user APIs work.
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path;
  const pathStr = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '';
  return proxy(request, pathStr);
}

async function proxy(request: NextRequest, path: string) {
  const url = `${AUTH_SERVICE_URL}/api/user${path}${request.nextUrl.search}`;
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
