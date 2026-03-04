import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendPasswordResetEmail } from '@/lib/email';
import { generateResetToken, hashToken, getResetTokenExpiry } from '@/lib/auth';
import { validate, forgotPasswordSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validate(forgotPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email } = validation.data;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Find user by email
    const userQuery = await adminDb.collection('users').where('email', '==', email).get();

    // Always return success to prevent email enumeration
    // But only actually send email if user exists
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      // Generate reset token
      const resetToken = generateResetToken();
      const hashedToken = hashToken(resetToken);
      const expiresAt = getResetTokenExpiry();

      // Store hashed token in user document
      await adminDb.collection('users').doc(userDoc.id).update({
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send password reset email (with unhashed token)
      const emailResult = await sendPasswordResetEmail(
        email,
        resetToken,
        userData.name
      );

      if (!emailResult.success) {
        console.error('Failed to send reset email:', emailResult.error);
        // Don't expose email sending failure to user
      }
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link shortly.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
