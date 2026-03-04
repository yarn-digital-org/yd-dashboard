import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getJwtSecret } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

    // Get current tokens to revoke
    const integrationDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('google')
      .get();

    if (integrationDoc.exists) {
      const data = integrationDoc.data();
      const accessToken = data?.accessToken;

      // Revoke the token with Google (best effort)
      if (accessToken) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
        } catch (revokeError) {
          // Log but don't fail - token might already be invalid
          console.warn('Failed to revoke Google token:', revokeError);
        }
      }

      // Delete the integration document from Firebase
      await adminDb
        .collection('users')
        .doc(userId)
        .collection('integrations')
        .doc('google')
        .delete();
    }

    console.log(`Google Calendar disconnected for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar', details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined },
      { status: 500 }
    );
  }
}
