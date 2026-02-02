import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Store push subscription for later use (e.g. via Resend, OneSignal, or Firebase).
 * MVP: accepts and validates subscription, returns success.
 * Production: persist to DB/Redis for server-side push delivery.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const endpoint = body?.endpoint;
    const keys = body?.keys;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid subscription: endpoint and keys required' } },
        { status: 400 }
      );
    }

    // TODO: Persist subscription (userId from auth, endpoint, keys) to DB/Redis
    // For now, accept and return success
    return NextResponse.json({ success: true, message: 'Push subscription registered' });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to register subscription' } },
      { status: 500 }
    );
  }
}
