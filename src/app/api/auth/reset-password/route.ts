import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { hashToken, isTokenExpired } from '@/lib/auth';
import { validate, resetPasswordSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validate(resetPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { token, password } = validation.data;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = hashToken(token);

    // Find user with matching reset token
    const userQuery = await adminDb
      .collection('users')
      .where('passwordResetToken', '==', hashedToken)
      .get();

    if (userQuery.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Check if token has expired
    if (!userData.passwordResetExpires || isTokenExpired(userData.passwordResetExpires)) {
      // Clear the expired token
      await adminDb.collection('users').doc(userDoc.id).update({
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await adminDb.collection('users').doc(userDoc.id).update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
