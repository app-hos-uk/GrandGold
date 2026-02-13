import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001';
const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS_ACCESS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 15 * 60, // 15 minutes (match JWT_ACCESS_EXPIRY)
};

const COOKIE_OPTIONS_REFRESH = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days (match JWT_REFRESH_EXPIRY)
};

/**
 * POST /api/auth/session — Login & set httpOnly cookies
 * Body: { email, password }
 * Returns: { user } (tokens stored in httpOnly cookies, NOT returned to client)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const upstream = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    // Unwrap various response shapes
    const tokens = data?.data?.tokens || data?.tokens;
    const user = data?.data?.user || data?.user;

    if (!tokens?.accessToken || !user) {
      return NextResponse.json(data, { status: upstream.status });
    }

    // Build response with user only (no tokens exposed to JS)
    const response = NextResponse.json({
      success: true,
      data: {
        user,
        // Send expiresIn so client knows when to trigger refresh
        expiresIn: tokens.expiresIn || 900,
      },
    });

    // Set httpOnly cookies
    response.cookies.set('gg_access_token', tokens.accessToken, COOKIE_OPTIONS_ACCESS);
    if (tokens.refreshToken) {
      response.cookies.set('gg_refresh_token', tokens.refreshToken, COOKIE_OPTIONS_REFRESH);
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Login failed' } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/auth/session — Logout & clear cookies
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('gg_access_token', '', { ...COOKIE_OPTIONS_ACCESS, maxAge: 0 });
  response.cookies.set('gg_refresh_token', '', { ...COOKIE_OPTIONS_REFRESH, maxAge: 0 });
  return response;
}
