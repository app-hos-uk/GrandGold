import axios from 'axios';
import pino from 'pino';

const logger = pino();

const NOTIFICATION_SERVICE_URL = 
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  data?: Record<string, any>;
}

/**
 * Service to send emails through the notification service
 * Emails are sent via Resend or in demo mode if API key not configured
 * 
 * NOTE: Errors are thrown to allow callers to handle email failures appropriately.
 * The notification service is critical for seller communication during onboarding.
 */
export class EmailService {
  /**
   * Send email via notification service
   * @throws Error if email sending fails
   */
  static async sendEmail(payload: EmailPayload): Promise<{ id: string; status: string; provider: string }> {
    try {
      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/send/email`,
        payload,
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.data.success) {
        const errorMsg = response.data.error?.message || 'Email send failed';
        logger.error(
          { 
            email: payload.to, 
            subject: payload.subject,
            error: response.data.error 
          },
          'Email API returned error'
        );
        throw new Error(`Email delivery failed: ${errorMsg}`);
      }

      const result = response.data.data;
      logger.info(
        { 
          email: payload.to, 
          subject: payload.subject,
          provider: result?.provider,
          id: result?.id
        },
        'Email sent successfully'
      );

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { 
          email: payload.to,
          subject: payload.subject,
          error: errorMsg
        },
        'Failed to send email'
      );
      throw error;  // Re-throw so callers can handle it
    }
  }

  /**
   * Send seller invitation email
   */
  static async sendInvitationEmail(
    email: string,
    firstName: string,
    businessName: string,
    tempPassword: string,
    onboardingUrl: string
  ): Promise<void> {
    const html = this.renderInvitationTemplate({
      email,
      firstName,
      businessName,
      tempPassword,
      onboardingUrl,
    });

    await this.sendEmail({
      to: email,
      subject: `Welcome to GrandGold - Complete Your Seller Setup, ${firstName}!`,
      body: html,
    });
  }

  /**
   * Send onboarding started confirmation
   */
  static async sendOnboardingStartedEmail(
    email: string,
    firstName: string,
    businessName: string
  ): Promise<void> {
    const html = this.renderOnboardingStartedTemplate({
      firstName,
      businessName,
    });

    await this.sendEmail({
      to: email,
      subject: 'Onboarding Started - Your Journey with GrandGold',
      body: html,
    });
  }

  /**
   * Send document upload confirmation
   */
  static async sendDocumentUploadedEmail(
    email: string,
    firstName: string,
    documents: string[]
  ): Promise<void> {
    const html = this.renderDocumentUploadedTemplate({
      firstName,
      documents,
    });

    await this.sendEmail({
      to: email,
      subject: 'Documents Received - Next Step: Bank Details',
      body: html,
    });
  }

  /**
   * Send approval confirmation
   */
  static async sendApprovalEmail(
    email: string,
    firstName: string,
    businessName: string,
    dashboardUrl: string
  ): Promise<void> {
    const html = this.renderApprovalTemplate({
      firstName,
      businessName,
      dashboardUrl,
    });

    await this.sendEmail({
      to: email,
      subject: `🎉 Congratulations! Your Seller Account is Approved`,
      body: html,
    });
  }

  /**
   * Send rejection email
   */
  static async sendRejectionEmail(
    email: string,
    firstName: string,
    reason: string
  ): Promise<void> {
    const html = this.renderRejectionTemplate({
      firstName,
      reason,
    });

    await this.sendEmail({
      to: email,
      subject: 'Onboarding Application Status - Action Required',
      body: html,
    });
  }

  /**
   * Render HTML template for invitation email
   */
  private static renderInvitationTemplate(data: {
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
    .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
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
      <p>Email: <strong>${data.email || 'your email'}</strong></p>
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

  private static renderOnboardingStartedTemplate(data: {
    firstName: string;
    businessName: string;
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
    .step { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #D4AF37; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Onboarding Started!</h2>
    </div>
    <div class="content">
      <p>Hi <strong>${data.firstName}</strong>,</p>
      
      <p>Welcome! Your onboarding for <strong>${data.businessName}</strong> has been initiated. 
      Here's what to expect over the next few steps:</p>
      
      <div class="step">
        <h4>Step 1: Business Information ✓ (Completed)</h4>
        <p>You've provided your business details and registration information.</p>
      </div>
      
      <div class="step">
        <h4>Step 2: Upload Documents (Next)</h4>
        <p>Please upload the following documents:</p>
        <ul>
          <li>Trade License / Business Registration Certificate</li>
          <li>VAT Certificate (if applicable)</li>
          <li>Gold Dealer Permit or Authorization</li>
        </ul>
        <p style="color: #666; font-size: 12px;">Accepted formats: PDF, JPEG, PNG (Max 10MB each)</p>
      </div>
      
      <div class="step">
        <h4>Step 3: Bank Details</h4>
        <p>Provide your business bank account information where we'll process your settlements.</p>
      </div>
      
      <div class="step">
        <h4>Step 4: Sign Agreement</h4>
        <p>Review and digitally sign the GrandGold Seller Agreement.</p>
      </div>
      
      <p><strong>Expected Timeline:</strong> Your application will be reviewed within 24-48 hours of submission.</p>
      
      <p>Questions about what documents you need? Check our help center or reach out to support.</p>
      
      <p>Best regards,<br>The GrandGold Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GrandGold. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static renderDocumentUploadedTemplate(data: {
    firstName: string;
    documents: string[];
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
    .document-item { background: white; padding: 10px; margin: 10px 0; border-left: 4px solid #28a745; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✓ Documents Received</h2>
    </div>
    <div class="content">
      <p>Hi <strong>${data.firstName}</strong>,</p>
      
      <p>Great! We've successfully received your documents. Here's what we have on file:</p>
      
      ${data.documents.map(doc => `<div class="document-item">✓ ${doc}</div>`).join('')}
      
      <h3>Next Step: Bank Details</h3>
      <p>Please log in to your seller dashboard and provide your business bank account information. 
      This helps us process your settlements correctly.</p>
      
      <p>After bank details, you'll need to sign our seller agreement, and then we'll review your application.</p>
      
      <p>Questions? Contact our support team at support@grandgold.com</p>
      
      <p>Best regards,<br>The GrandGold Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GrandGold. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static renderApprovalTemplate(data: {
    firstName: string;
    businessName: string;
    dashboardUrl: string;
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
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
    .emoji { font-size: 48px; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .features { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🎉</div>
      <h1>You're Approved!</h1>
      <p>Your seller account is now active</p>
    </div>
    <div class="content">
      <p>Hi <strong>${data.firstName}</strong>,</p>
      
      <p style="font-size: 18px; color: #28a745; font-weight: bold;">Congratulations! Your application for <strong>${data.businessName}</strong> has been approved!</p>
      
      <p>Your seller account is now fully active, and you can start uploading products and accepting orders.</p>
      
      <h3>Here's what you can do now:</h3>
      <div class="features">
        <ul>
          <li><strong>Add Products:</strong> Upload your jewelry and precious metals</li>
          <li><strong>Manage Inventory:</strong> Track stock levels and availability</li>
          <li><strong>Process Orders:</strong> Receive and fulfill customer orders</li>
          <li><strong>Payments:</strong> Receive settlements to your verified bank account</li>
          <li><strong>Analytics:</strong> View sales performance and customer insights</li>
        </ul>
      </div>
      
      <h3>Quick Start Guide</h3>
      <p>To get the most out of your GrandGold seller account:</p>
      <ol>
        <li>Complete your business profile with logo and description</li>
        <li>Set up your pricing and commission preferences</li>
        <li>Upload your first batch of products</li>
        <li>Customize your store appearance</li>
      </ol>
      
      <a href="${data.dashboardUrl}" class="button">Go to Seller Dashboard</a>
      
      <h3>Commission Structure</h3>
      <p>We charge a competitive commission on each sale. Your earnings are automatically calculated and settled to your bank account every week.</p>
      
      <h3>Need Help?</h3>
      <p>Check out our comprehensive help center or contact our seller support team at <strong>sellers@grandgold.com</strong></p>
      
      <p>Welcome to the GrandGold family! We're excited to help you grow your business.</p>
      
      <p>Best regards,<br>The GrandGold Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GrandGold. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private static renderRejectionTemplate(data: {
    firstName: string;
    reason: string;
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
    .header { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Onboarding Application Review</h2>
    </div>
    <div class="content">
      <p>Dear <strong>${data.firstName}</strong>,</p>
      
      <p>Thank you for your interest in becoming a GrandGold seller. We've carefully reviewed your application, 
      and unfortunately, we are unable to approve it at this time.</p>
      
      <h3>Reason for Decision:</h3>
      <div class="reason-box">
        <p>${data.reason}</p>
      </div>
      
      <h3>What Next?</h3>
      <p>You have a few options:</p>
      <ul>
        <li><strong>Reapply:</strong> Address the issues mentioned above and submit a new application</li>
        <li><strong>Appeal:</strong> If you believe this decision was made in error, contact our support team</li>
        <li><strong>Learn More:</strong> Check our seller requirements and guidelines</li>
      </ul>
      
      <h3>How to Reapply</h3>
      <p>Once you've addressed the concerns, you can reapply through your seller dashboard. 
      We'll be happy to review your updated application.</p>
      
      <h3>Questions or Appeals?</h3>
      <p>If you'd like to discuss this decision or have questions about your application, 
      please reach out to our seller support team:</p>
      <p>
        Email: <strong>sellers@grandgold.com</strong><br>
        Hours: Monday-Friday, 9 AM - 6 PM (local time)
      </p>
      
      <p>We appreciate your understanding and hope to welcome you to GrandGold in the future!</p>
      
      <p>Best regards,<br>The GrandGold Onboarding Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GrandGold. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
