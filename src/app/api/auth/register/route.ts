import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validate, registerSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendEmailWithFallback } from '@/lib/email-service';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes, createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registrations per minute per IP
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 5, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)) }
        }
      );
    }

    const body = await request.json();

    // Validate input (password requirements enforced by registerSchema: 8+ chars, 1 uppercase, 1 number)
    const validation = validate(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check if user already exists
    const existingUser = await adminDb.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');

    // Create user
    const userId = uuidv4();
    const now = new Date().toISOString();
    
    const userData = {
      id: userId,
      email,
      name: name || email.split('@')[0],
      password: hashedPassword,
      role: 'user',
      emailVerified: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('users').doc(userId).set(userData);

    // Send verification email (graceful degradation)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yd-dashboard.vercel.app';
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${verificationToken}&userId=${userId}`;
    
    await sendEmailWithFallback({
      to: email,
      subject: 'Verify your email - Yarn Digital Dashboard',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0A0A0A;">YARN<span style="color: #FF3300;">.</span> Dashboard</h1>
        <p style="margin: 0 0 16px; font-size: 16px; color: #0A0A0A;">Hi ${name || email.split('@')[0]},</p>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">Please verify your email address to complete your registration.</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #FF3300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; margin-bottom: 24px;">Verify Email</a>
        <p style="margin: 24px 0 0; font-size: 14px; color: #7A7A7A;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #7A7A7A;">© 2026 Yarn Digital. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully. Please check your email to verify your account.'
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
