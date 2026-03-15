import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    // Verify user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }

    const jwtSecret = getJwtSecret();
    jwt.verify(token, jwtSecret);

    const clientId = process.env.XERO_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/integrations/xero/callback`;

    if (!clientId) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=config&message=${encodeURIComponent('Xero integration not configured')}`
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in cookie
    const cookieResponse = NextResponse.redirect(
      `https://login.xero.com/identity/connect/authorize?` +
      `response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('openid profile email accounting.transactions accounting.contacts accounting.settings.read offline_access')}` +
      `&state=${state}`
    );

    cookieResponse.cookies.set('xero_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return cookieResponse;
  } catch {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=auth&message=${encodeURIComponent('Please log in first')}`
    );
  }
}
