import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getJwtSecret } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let jwtSecret: string;
    try {
      jwtSecret = getJwtSecret();
    } catch (error) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, jwtSecret) as { userId: string };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { userId } = decoded;

    // Get integration status
    const integrationDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('google')
      .get();

    if (!integrationDoc.exists) {
      return NextResponse.json({
        connected: false,
        email: null,
        connectedAt: null,
      });
    }

    const data = integrationDoc.data();
    
    // Check if token is expired
    const isExpired = data?.expiresAt && data.expiresAt < Date.now();

    return NextResponse.json({
      connected: true,
      email: data?.email || null,
      connectedAt: data?.connectedAt?.toDate?.()?.toISOString() || null,
      tokenExpired: isExpired,
      hasRefreshToken: !!data?.refreshToken,
    });
  } catch (error: any) {
    console.error('Error checking Google Calendar status:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status', details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined },
      { status: 500 }
    );
  }
}
