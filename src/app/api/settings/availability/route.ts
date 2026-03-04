import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
  NotFoundError,
} from '@/lib/api-middleware';

// Validation schema for availability settings
const availabilitySchema = z.object({
  workingDays: z.array(z.number().min(0).max(6)).optional(),
  workingHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  breakTimes: z.array(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  bufferMinutes: z.number().min(0).max(120).optional(),
  minNoticeHours: z.number().min(0).max(168).optional(),
  maxAdvanceDays: z.number().min(1).max(365).optional(),
  blockedDates: z.array(z.string()).optional(),
});

// GET - Fetch availability settings
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();

  const docRef = db.collection('availabilitySettings').doc(user.userId);
  const doc = await docRef.get();

  if (!doc.exists) {
    // Return default settings
    return successResponse({
      userId: user.userId,
      workingDays: [1, 2, 3, 4, 5], // Mon-Fri
      workingHours: {
        start: '09:00',
        end: '17:00',
      },
      breakTimes: [],
      bufferMinutes: 15,
      minNoticeHours: 24,
      maxAdvanceDays: 30,
      blockedDates: [],
      updatedAt: new Date().toISOString(),
    });
  }

  return successResponse({
    ...doc.data(),
    userId: user.userId,
  });
});

// PUT - Update availability settings
export const PUT = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, availabilitySchema);

  const updateData = {
    userId: user.userId,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const docRef = db.collection('availabilitySettings').doc(user.userId);
  await docRef.set(updateData, { merge: true });

  const updated = await docRef.get();

  return successResponse(updated.data());
});
