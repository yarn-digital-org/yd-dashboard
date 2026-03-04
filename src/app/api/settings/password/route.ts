import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
  ValidationError,
  NotFoundError,
} from '@/lib/api-middleware';

// Validation schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// PUT - Change password
export const PUT = withAuth(async (request, { user }) => {
  const db = requireDb();
  const { currentPassword, newPassword } = await validateBody(request, passwordChangeSchema);

  // Get user with password
  const userDoc = await db.collection('users').doc(user.userId).get();

  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }

  const userData = userDoc.data();
  
  if (!userData?.password) {
    throw new ValidationError('Unable to verify current password');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, userData.password);
  
  if (!isValid) {
    throw new ValidationError('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await db.collection('users').doc(user.userId).update({
    password: hashedPassword,
    updatedAt: new Date().toISOString(),
  });

  return successResponse({ message: 'Password updated successfully' });
});
