import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getJwtSecret } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get JWT secret
    let jwtSecret: string;
    try {
      jwtSecret = getJwtSecret();
    } catch (error) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json({ user: null });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string; role: string };

    // Get user from Firestore
    const userDoc = await adminDb.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ user: null });
    }

    const userData = userDoc.data();
    const { 
      password: _, 
      passwordResetToken: __, 
      passwordResetExpires: ___, 
      ...userWithoutSensitive 
    } = userData as any;

    return NextResponse.json({ user: userWithoutSensitive });
  } catch (error: any) {
    // Token invalid or expired - clear the cookie
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    return NextResponse.json({ user: null });
  }
}
