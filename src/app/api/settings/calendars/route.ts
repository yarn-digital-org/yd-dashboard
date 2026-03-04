import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
} from '@/lib/api-middleware';

// Validation schema for calendar settings
const calendarSettingsSchema = z.object({
  selectedCalendars: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    enabled: z.boolean(),
  })).optional(),
  defaultCalendarId: z.string().optional(),
  syncEnabled: z.boolean().optional(),
});

// GET - Fetch calendar settings
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();

  const docRef = db.collection('calendarSettings').doc(user.userId);
  const doc = await docRef.get();

  if (!doc.exists) {
    // Return default settings
    return successResponse({
      userId: user.userId,
      selectedCalendars: [],
      defaultCalendarId: '',
      syncEnabled: true,
      updatedAt: new Date().toISOString(),
    });
  }

  return successResponse({
    ...doc.data(),
    userId: user.userId,
  });
});

// PUT - Update calendar settings
export const PUT = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, calendarSettingsSchema);

  const updateData = {
    userId: user.userId,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const docRef = db.collection('calendarSettings').doc(user.userId);
  await docRef.set(updateData, { merge: true });

  const updated = await docRef.get();

  return successResponse(updated.data());
});
