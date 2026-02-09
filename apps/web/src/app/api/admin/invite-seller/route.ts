import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001';
const NOTIFICATION_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:4004';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

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

    // Send invitation email via notification service
    const onboardingUrl = `${WEB_URL}/seller/onboarding`;
    let emailStatus: 'sent' | 'failed' | 'queued' = 'queued';
    let emailError: string | null = null;

    try {
      const emailResponse = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/send/email`,
        {
          to: email,
          subject: `Welcome to GrandGold - Complete Your Seller Setup, ${firstName}!`,
          body: renderInvitationTemplate({
            firstName,
            businessName,
            tempPassword: password,
            onboardingUrl,
            email,
          }),
        },
        { timeout: 10000 }
      );

      // Check if email API response indicates success
      if (emailResponse.data?.success) {
        emailStatus = emailResponse.data.data?.provider === 'demo' ? 'queued' : 'sent';
      } else {
        emailStatus = 'failed';
        emailError = emailResponse.data?.error?.message || 'Email send failed';
      }
    } catch (emailErr) {
      emailStatus = 'failed';
      emailError = emailErr instanceof Error 
        ? emailErr.message 
        : 'Unable to send email - notification service unavailable';
      
      // Log the error for debugging
      console.error('[SELLER_INVITE] Email send failed:', {
        email,
        businessName,
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }

    // Determine response based on email status
    if (emailStatus === 'failed') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Seller account created, but invitation email could not be sent: ${emailError}. Please manually notify the seller or resend the invitation.`,
            details: {
              userCreated: true,
              emailSent: false,
              email,
              password,  // Use the actual password variable (generated or provided)
              onboardingUrl,
            },
          },
        },
        { status: 500 }
      );
    }

    // Success response with accurate email status
    const successMessage = emailStatus === 'queued'
      ? `Seller account created (demo mode - email queued). Invitation URL: ${onboardingUrl}`
      : `Seller account created successfully. Invitation email sent to ${email}.`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      data: {
        email,
        onboardingUrl,
        tempPasswordProvided: !!tempPassword,
        emailStatus,
        accountCreated: true,
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

/**
 * Render HTML template for invitation email
 */
function renderInvitationTemplate(data: {
  firstName: string;
  businessName: string;
  tempPassword: string;
  onboardingUrl: string;
  email: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .password-box { background: #f0f0f0; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; font-family: monospace; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to GrandGold Marketplace!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${data.firstName}</strong>,</p>
      
      <p>We're excited to have <strong>${data.businessName}</strong> join the GrandGold marketplace! 
      Your seller account has been created and is ready for setup.</p>
      
      <h3>Your Login Credentials</h3>
      <p>Email: <strong>${data.email}</strong></p>
      <div class="password-box">
        Temporary Password: <strong>${data.tempPassword}</strong>
      </div>
      <p style="color: #d9534f; font-size: 12px;">⚠️ Please change this password after your first login for security.</p>
      
      <h3>Complete Your Setup</h3>
      <p>To get started, click the button below to begin your seller onboarding journey. You'll provide:</p>
      <ul>
        <li>Business Information & Registration Details</li>
        <li>Required Documents (Trade License, VAT Certificate, etc.)</li>
        <li>Bank Account Details for Payments</li>
        <li>Seller Agreement Signature</li>
      </ul>
      
      <a href="${data.onboardingUrl}" class="button">Start Onboarding</a>
      
      <p>We typically review applications within 24-48 hours. You'll receive an email update once your account is approved.</p>
      
      <h3>Questions?</h3>
      <p>Our support team is here to help! Contact us at <strong>support@grandgold.com</strong></p>
      
      <p>Best regards,<br>The GrandGold Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GrandGold. All rights reserved.</p>
      <p>This email was sent to you because you were invited as a seller. If this was a mistake, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}
