import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    if (!adminDb) {
      return NextResponse.json({ connected: false, error: 'Database not configured' });
    }

    const doc = await adminDb
      .collection('users')
      .doc(decoded.userId)
      .collection('integrations')
      .doc('xero')
      .get();

    if (!doc.exists) {
      return NextResponse.json({ connected: false });
    }

    const data = doc.data();
    const isExpired = (data?.expiresAt || 0) < Date.now();

    return NextResponse.json({
      connected: true,
      tenantName: data?.tenantName || null,
      connectedAt: data?.connectedAt || null,
      tokenExpired: isExpired,
      hasRefreshToken: !!data?.refreshToken,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
