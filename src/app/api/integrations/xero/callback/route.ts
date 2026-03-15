import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    // Get auth code and state from URL
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=xero&message=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=xero&message=${encodeURIComponent('Missing authorization code')}`
      );
    }

    // Verify state (CSRF)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('xero_oauth_state')?.value;
    if (state !== storedState) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=xero&message=${encodeURIComponent('Invalid state parameter')}`
      );
    }

    // Get user
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.redirect(`${appUrl}/login`);
    }
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    // Exchange code for tokens
    const clientId = process.env.XERO_CLIENT_ID;
    const clientSecret = process.env.XERO_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/integrations/xero/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=config&message=${encodeURIComponent('Xero not configured')}`
      );
    }

    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('Xero token exchange failed:', tokenData);
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=xero&message=${encodeURIComponent('Failed to connect Xero')}`
      );
    }

    // Get tenant connections (orgs)
    const connectionsRes = await fetch('https://api.xero.com/connections', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const connections = await connectionsRes.json();
    const tenant = Array.isArray(connections) && connections.length > 0 ? connections[0] : null;

    // Store tokens in Firestore
    if (!adminDb) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=db&message=${encodeURIComponent('Database not configured')}`
      );
    }

    await adminDb
      .collection('users')
      .doc(decoded.userId)
      .collection('integrations')
      .doc('xero')
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        tenantId: tenant?.tenantId || null,
        tenantName: tenant?.tenantName || null,
        connectedAt: new Date().toISOString(),
      });

    // Clear state cookie
    const response = NextResponse.redirect(
      `${appUrl}/settings/integrations?success=true&message=${encodeURIComponent('Xero connected successfully!')}`
    );
    response.cookies.delete('xero_oauth_state');
    return response;

  } catch (err) {
    console.error('Xero callback error:', err);
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=xero&message=${encodeURIComponent('Something went wrong')}`
    );
  }
}
