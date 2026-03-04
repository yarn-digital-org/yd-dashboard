import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/api-middleware';

const appointmentTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  durationMinutes: z.enum(['15', '30', '45', '60']).or(z.number().refine(val => [15, 30, 45, 60].includes(val))).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  bufferMinutes: z.number().min(0).max(120).optional(),
  addGoogleMeet: z.boolean().optional(),
  customQuestions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    required: z.boolean(),
    type: z.enum(['short_text', 'long_text', 'email', 'phone']),
  })).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get single appointment type
export const GET = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;

  const doc = await db.collection('appointmentTypes').doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Appointment type not found');
  }

  const data = doc.data();
  if (data?.userId !== user.userId) {
    throw new UnauthorizedError('Not authorized to access this appointment type');
  }

  return successResponse({ id: doc.id, ...data });
});

// PUT - Update appointment type
export const PUT = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;
  const updates = await validateBody(request, appointmentTypeSchema);

  const docRef = db.collection('appointmentTypes').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Appointment type not found');
  }

  const data = doc.data();
  if (data?.userId !== user.userId) {
    throw new UnauthorizedError('Not authorized to update this appointment type');
  }

  // Convert duration to number if string
  const updateData: any = { ...updates };
  if (updateData.durationMinutes && typeof updateData.durationMinutes === 'string') {
    updateData.durationMinutes = parseInt(updateData.durationMinutes);
  }

  updateData.updatedAt = new Date().toISOString();

  await docRef.update(updateData);

  const updated = await docRef.get();
  return successResponse({ id: updated.id, ...updated.data() });
});

// DELETE - Delete appointment type
export const DELETE = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;

  const docRef = db.collection('appointmentTypes').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Appointment type not found');
  }

  const data = doc.data();
  if (data?.userId !== user.userId) {
    throw new UnauthorizedError('Not authorized to delete this appointment type');
  }

  await docRef.delete();

  return successResponse({ id, deleted: true });
});
