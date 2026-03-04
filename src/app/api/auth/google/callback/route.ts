import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const redirectUrl = new URL('/settings/integrations', baseUrl);

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    redirectUrl.searchParams.set('error', 'oauth_denied');
    redirectUrl.searchParams.set('message', 'Google Calendar connection was denied');
    return NextResponse.redirect(redirectUrl.toString());
  }

  if (!code || !state) {
    redirectUrl.searchParams.set('error', 'invalid_request');
    redirectUrl.searchParams.set('message', 'Missing authorization code or state');
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    // Decode and validate state parameter
    let stateData: { userId: string; nonce: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch (e) {
      redirectUrl.searchParams.set('error', 'invalid_state');
      redirectUrl.searchParams.set('message', 'Invalid state parameter');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Check state timestamp (10 minute expiry)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      redirectUrl.searchParams.set('error', 'state_expired');
      redirectUrl.searchParams.set('message', 'Authorization request expired');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validate state against stored value
    if (adminDb) {
      const stateDoc = await adminDb.collection('oauth_states').doc(stateData.nonce).get();
      if (!stateDoc.exists) {
        redirectUrl.searchParams.set('error', 'invalid_state');
        redirectUrl.searchParams.set('message', 'Invalid or expired state');
        return NextResponse.redirect(redirectUrl.toString());
      }
      // Clean up used state
      await adminDb.collection('oauth_states').doc(stateData.nonce).delete();
    }

    const { userId } = stateData;

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      redirectUrl.searchParams.set('error', 'token_exchange_failed');
      redirectUrl.searchParams.set('message', tokenData.error_description || 'Failed to exchange authorization code');
      return NextResponse.redirect(redirectUrl.toString());
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token) {
      redirectUrl.searchParams.set('error', 'no_access_token');
      redirectUrl.searchParams.set('message', 'No access token received');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Get user's email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    let email = '';
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      email = userInfo.email || '';
    }

    // Store tokens in Firebase
    if (!adminDb) {
      throw new Error('Database not configured');
    }

    const expiresAt = Date.now() + (expires_in * 1000);

    await adminDb.collection('users').doc(userId).collection('integrations').doc('google').set({
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt,
      email,
      connectedAt: FieldValue.serverTimestamp(),
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });

    console.log(`Google Calendar connected for user ${userId} (${email})`);

    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('message', 'Google Calendar connected successfully');
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    redirectUrl.searchParams.set('error', 'callback_failed');
    redirectUrl.searchParams.set('message', error.message || 'Failed to complete connection');
    return NextResponse.redirect(redirectUrl.toString());
  }
}
