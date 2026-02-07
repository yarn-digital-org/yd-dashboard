import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name || email.split('@')[0],
    });

    // Store additional user data in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
      role: 'user',
    });

    return NextResponse.json({ 
      success: true, 
      user: { uid: userRecord.uid, email: userRecord.email } 
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
  }
}
