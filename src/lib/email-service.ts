/**
 * Email service using Resend
 * Replaces the n8n webhook email service
 */

import { Resend } from 'resend';

// Initialize Resend lazily (will use RESEND_API_KEY from env)
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build');
  }
  return _resend;
}

// Default sender email
const DEFAULT_FROM = process.env.EMAIL_FROM || 'noreply@yarndigital.co.uk';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await getResend().emails.send({
      from: options.from || DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<SendEmailResult> {
  const subject = 'Welcome to Yarn Digital Dashboard';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
          YARN<span style="color: #FF3300;">.</span> Dashboard
        </h1>

        <p style="margin: 0 0 16px; font-size: 16px; color: #0A0A0A;">
          Hi ${userName},
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          Welcome to Yarn Digital Dashboard! Your account has been successfully created.
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          Get started by exploring your dashboard, managing projects, tracking leads, and automating your workflows.
        </p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yd-dashboard.vercel.app'}/dashboard"
           style="display: inline-block; background-color: #FF3300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; margin-bottom: 24px;">
          Go to Dashboard
        </a>

        <p style="margin: 24px 0 0; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          If you have any questions, feel free to reach out to our support team.
        </p>

        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #7A7A7A;">
          © 2026 Yarn Digital. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, html });
}

/**
 * Send invoice sent notification
 */
export async function sendInvoiceSentEmail(
  email: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  downloadUrl?: string
): Promise<SendEmailResult> {
  const subject = `Invoice ${invoiceNumber} - ${amount}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
          YARN<span style="color: #FF3300;">.</span> Dashboard
        </h1>

        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0A0A0A;">
          New Invoice
        </h2>

        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          You have received a new invoice from Yarn Digital.
        </p>

        <table style="width: 100%; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px; background-color: #F5F5F5; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #7A7A7A;">Invoice Number</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0A0A0A;">${invoiceNumber}</p>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 12px; background-color: #F5F5F5; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #7A7A7A;">Amount Due</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0A0A0A;">${amount}</p>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 12px; background-color: #F5F5F5; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #7A7A7A;">Due Date</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0A0A0A;">${dueDate}</p>
            </td>
          </tr>
        </table>

        ${downloadUrl ? `
        <a href="${downloadUrl}"
           style="display: inline-block; background-color: #FF3300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; margin-bottom: 24px;">
          Download Invoice
        </a>
        ` : ''}

        <p style="margin: 24px 0 0; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          Please ensure payment is made by the due date to avoid any service interruption.
        </p>

        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #7A7A7A;">
          © 2026 Yarn Digital. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, html });
}

/**
 * Send contract sent notification
 */
export async function sendContractSentEmail(
  email: string,
  clientName: string,
  contractTitle: string,
  reviewUrl?: string
): Promise<SendEmailResult> {
  const subject = `New Contract: ${contractTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
          YARN<span style="color: #FF3300;">.</span> Dashboard
        </h1>

        <p style="margin: 0 0 16px; font-size: 16px; color: #0A0A0A;">
          Hi ${clientName},
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          A new contract is ready for your review: <strong>${contractTitle}</strong>
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          Please review the contract details and sign at your earliest convenience.
        </p>

        ${reviewUrl ? `
        <a href="${reviewUrl}"
           style="display: inline-block; background-color: #FF3300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; margin-bottom: 24px;">
          Review Contract
        </a>
        ` : ''}

        <p style="margin: 24px 0 0; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          If you have any questions about this contract, please contact us.
        </p>

        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #7A7A7A;">
          © 2026 Yarn Digital. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, html });
}

/**
 * Send booking confirmation
 */
export async function sendBookingConfirmationEmail(
  email: string,
  clientName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  location?: string
): Promise<SendEmailResult> {
  const subject = `Booking Confirmed: ${eventTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
          YARN<span style="color: #FF3300;">.</span> Dashboard
        </h1>

        <p style="margin: 0 0 16px; font-size: 16px; color: #0A0A0A;">
          Hi ${clientName},
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          Your booking has been confirmed!
        </p>

        <table style="width: 100%; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px; background-color: #F5F5F5; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #7A7A7A;">Event</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0A0A0A;">${eventTitle}</p>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 12px; background-color: #F5F5F5; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #7A7A7A;">Date</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0A0A0A;">${eventDate}</p>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 12px; background-color: #F5F5F5; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #7A7A7A;">Time</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0A0A0A;">${eventTime}</p>
            </td>
          </tr>
          ${location ? `
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 12px; background-color: #F5F5F5; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #7A7A7A;">Location</p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0A0A0A;">${location}</p>
            </td>
          </tr>
          ` : ''}
        </table>

        <p style="margin: 24px 0 0; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          We look forward to seeing you! If you need to make any changes, please contact us.
        </p>

        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #7A7A7A;">
          © 2026 Yarn Digital. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): Promise<SendEmailResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://yd-dashboard.vercel.app'}/reset-password?token=${resetToken}`;
  const subject = 'Reset Your Password - Yarn Digital';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
          YARN<span style="color: #FF3300;">.</span> Dashboard
        </h1>

        <p style="margin: 0 0 16px; font-size: 16px; color: #0A0A0A;">
          Hi${userName ? ` ${userName}` : ''},
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>

        <a href="${resetUrl}"
           style="display: inline-block; background-color: #FF3300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; margin-bottom: 24px;">
          Reset Password
        </a>

        <p style="margin: 24px 0 16px; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
        </p>

        <p style="margin: 0 0 16px; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin: 0; font-size: 12px; color: #7A7A7A; word-break: break-all;">
          ${resetUrl}
        </p>

        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #7A7A7A;">
          © 2026 Yarn Digital. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, html });
}
