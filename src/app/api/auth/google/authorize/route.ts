import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getJwtSecret } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Google OAuth scopes for calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login?redirect=/settings/integrations', request.url));
    }

    let jwtSecret: string;
    try {
      jwtSecret = getJwtSecret();
    } catch (error) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify token and get user ID
    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    } catch (error) {
      return NextResponse.redirect(new URL('/login?redirect=/settings/integrations', request.url));
    }

    // Get OAuth credentials from environment
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Missing GOOGLE_CLIENT_ID.' },
        { status: 500 }
      );
    }

    // Generate state parameter with user ID for security
    // Format: userId:randomNonce
    const nonce = crypto.randomBytes(16).toString('hex');
    const state = Buffer.from(JSON.stringify({
      userId: decoded.userId,
      nonce,
      timestamp: Date.now(),
    })).toString('base64url');

    // Store state in Firestore for validation
    if (adminDb) {
      await adminDb.collection('oauth_states').doc(nonce).set({
        userId: decoded.userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minute expiry
      });
    }

    // Build Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline'); // Required for refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error generating Google OAuth URL:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth', details: error.message },
      { status: 500 }
    );
  }
}
