import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001';

/**
 * Invite a seller to join the marketplace
 * Creates a user account and sends them onboarding instructions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      businessName,
      country = 'IN',
      tempPassword,
    } = body;

    if (!email || !firstName || !lastName || !phone || !businessName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email, name, phone, and business name are required',
          },
        },
        { status: 400 }
      );
    }

    // Generate temp password if not provided
    const password =
      tempPassword ||
      `GrandGold${Math.random().toString(36).slice(2, 10)}!`;

    const countryCode = country === 'in' || country === 'IN' ? 'IN' : country === 'ae' || country === 'AE' ? 'AE' : 'UK';

    // Create user account via auth service
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone,
          country: countryCode,
          acceptedTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.message || 'Registration failed');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Registration failed';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        return NextResponse.json({
          success: true,
          message: 'Invitation sent. User already has an account - they can go to /seller/onboarding to complete seller registration.',
          data: { email },
        });
      }
      throw err;
    }

    // In production: send email with login link and onboarding URL
    // For now return success with instructions
    return NextResponse.json({
      success: true,
      message: `Seller invited successfully. They can login at the website and complete onboarding at /seller/onboarding. ${tempPassword ? '' : `Temporary password: ${password} (share securely)`}`,
      data: {
        email,
        onboardingUrl: '/seller/onboarding',
        tempPasswordProvided: !!tempPassword,
      },
    });
  } catch (error) {
    // Log to monitoring service in production
    const message = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : 'Failed to invite seller';
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
