import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
  NotFoundError,
} from '@/lib/api-middleware';

// Validation schema for profile update
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
});

// GET - Fetch current user profile
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();

  const userDoc = await db.collection('users').doc(user.userId).get();

  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }

  const userData = userDoc.data() || {};
  
  // Remove sensitive fields
  const { password, ...safeData } = userData;

  return successResponse({
    ...safeData,
    id: user.userId,
    email: user.email,
  });
});

// PUT - Update user profile
export const PUT = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, updateProfileSchema);

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;

  // Also update the name field for backwards compatibility
  if (data.firstName !== undefined) {
    const lastName = data.lastName || '';
    updateData.name = `${data.firstName} ${lastName}`.trim();
  }

  await db.collection('users').doc(user.userId).update(updateData);

  // Fetch updated user
  const updatedDoc = await db.collection('users').doc(user.userId).get();
  const updatedData = updatedDoc.data() || {};
  const { password, ...safeData } = updatedData;

  return successResponse({
    ...safeData,
    id: user.userId,
  });
});
