import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validate, registerSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validate(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check if user already exists
    const existingUser = await adminDb.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = uuidv4();
    const now = new Date().toISOString();
    
    const userData = {
      id: userId,
      email,
      name: name || email.split('@')[0],
      password: hashedPassword,
      role: 'user',
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('users').doc(userId).set(userData);

    // Send welcome email (fire and forget)
    try {
      const { sendWelcomeEmail } = await import('@/lib/email-notifications');
      await sendWelcomeEmail(userId, email, name || email.split('@')[0]);
    } catch (e) {
      console.error('Failed to send welcome email:', e);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully. You can now log in.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
