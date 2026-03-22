import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getJwtSecret } from '@/lib/auth';
import { validate, loginSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp, isAccountLocked, recordFailedLogin, recordSuccessfulLogin } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP: 10 attempts per minute
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 10, 60 * 1000);
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

    // Validate input
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Check account lockout
    const lockout = isAccountLocked(email);
    if (lockout.locked) {
      const minutes = Math.ceil((lockout.retryAfterMs || 0) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute(s).` },
        { status: 423 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get JWT secret (throws if not configured)
    let jwtSecret: string;
    try {
      jwtSecret = getJwtSecret();
    } catch (error) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Find user by email
    const userQuery = await adminDb.collection('users').where('email', '==', email).get();
    
    if (userQuery.empty) {
      recordFailedLogin(email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValid = await bcrypt.compare(password, userData.password);
    if (!isValid) {
      recordFailedLogin(email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Successful login - clear lockout
    recordSuccessfulLogin(email);

    // Create JWT token with reasonable expiry
    const token = jwt.sign(
      { 
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        orgId: userData.orgId || userData.id,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Set cookie with security attributes
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Update last login
    await adminDb.collection('users').doc(userDoc.id).update({
      lastLoginAt: new Date().toISOString(),
    });

    // Return user (without password)
    const { password: _, passwordResetToken: __, passwordResetExpires: ___, ...userWithoutSensitive } = userData;

    return NextResponse.json({ 
      success: true, 
      user: userWithoutSensitive
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
