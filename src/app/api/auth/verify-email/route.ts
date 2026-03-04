import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createHash } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token || !userId) {
      return NextResponse.redirect(new URL('/login?error=invalid-verification-link', request.url));
    }

    if (!adminDb) {
      return NextResponse.redirect(new URL('/login?error=server-error', request.url));
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.redirect(new URL('/login?error=invalid-verification-link', request.url));
    }

    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.redirect(new URL('/login?error=invalid-verification-link', request.url));
    }

    if (userData.emailVerified) {
      return NextResponse.redirect(new URL('/login?message=email-already-verified', request.url));
    }

    if (userData.emailVerificationToken !== tokenHash) {
      return NextResponse.redirect(new URL('/login?error=invalid-verification-link', request.url));
    }

    // Check expiry
    if (userData.emailVerificationExpires && new Date(userData.emailVerificationExpires) < new Date()) {
      return NextResponse.redirect(new URL('/login?error=verification-link-expired', request.url));
    }

    // Mark email as verified
    await adminDb.collection('users').doc(userId).update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL('/login?message=email-verified', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url));
  }
}
