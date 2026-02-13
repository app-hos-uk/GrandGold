import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001';
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * POST /api/auth/session/refresh — Rotate tokens using httpOnly refresh cookie
 * No body required — reads refresh token from httpOnly cookie.
 * Returns new access/refresh tokens as httpOnly cookies.
 */
export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('gg_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'Not authenticated' } },
        { status: 401 },
      );
    }

    const upstream = await fetch(`${AUTH_SERVICE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      // Refresh failed — clear cookies so client redirects to login
      const errRes = NextResponse.json(
        { success: false, error: data?.error || { code: 'REFRESH_FAILED', message: 'Session expired' } },
        { status: 401 },
      );
      errRes.cookies.set('gg_access_token', '', { httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/', maxAge: 0 });
      errRes.cookies.set('gg_refresh_token', '', { httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/', maxAge: 0 });
      return errRes;
    }

    const tokens = data?.data?.tokens || data?.tokens;
    if (!tokens?.accessToken) {
      return NextResponse.json(
        { success: false, error: { code: 'REFRESH_FAILED', message: 'Invalid refresh response' } },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ success: true, data: { expiresIn: tokens.expiresIn || 900 } });
    response.cookies.set('gg_access_token', tokens.accessToken, {
      httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/', maxAge: 15 * 60,
    });
    if (tokens.refreshToken) {
      response.cookies.set('gg_refresh_token', tokens.refreshToken, {
        httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Refresh failed' } },
      { status: 500 },
    );
  }
}
