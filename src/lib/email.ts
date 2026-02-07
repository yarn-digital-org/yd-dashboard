/**
 * Email service utility using n8n webhook
 * Endpoint: https://n8n.yarndigital.co.uk:5678/webhook/send-email
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: boolean;
  account?: 'hello' | 'jonny';
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

const N8N_EMAIL_WEBHOOK = 'https://n8n.yarndigital.co.uk:5678/webhook/send-email';

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const response = await fetch(N8N_EMAIL_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: options.account || 'hello',
        to: options.to,
        subject: options.subject,
        body: options.body,
        html: options.html ?? true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email send failed:', errorText);
      return { success: false, error: `Email service error: ${response.status}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
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
  
  const body = `
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
        <!-- Logo -->
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
          YARN<span style="color: #FF3300;">.</span> Dashboard
        </h1>
        
        <!-- Greeting -->
        <p style="margin: 0 0 16px; font-size: 16px; color: #0A0A0A;">
          Hi${userName ? ` ${userName}` : ''},
        </p>
        
        <!-- Message -->
        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        
        <!-- CTA Button -->
        <a href="${resetUrl}" style="display: inline-block; background-color: #FF3300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; margin-bottom: 24px;">
          Reset Password
        </a>
        
        <!-- Expiry notice -->
        <p style="margin: 24px 0 16px; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
        </p>
        
        <!-- Fallback link -->
        <p style="margin: 0 0 16px; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin: 0; font-size: 12px; color: #7A7A7A; word-break: break-all;">
          ${resetUrl}
        </p>
        
        <!-- Footer -->
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

  return sendEmail({
    to: email,
    subject,
    body,
    html: true,
  });
}
