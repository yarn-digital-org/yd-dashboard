import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
  BadRequestError,
} from '@/lib/api-middleware';

// Validation schema for appointment type
const appointmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  durationMinutes: z.enum(['15', '30', '45', '60']).or(z.number().refine(val => [15, 30, 45, 60].includes(val))),
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

// GET - List all appointment types (public if userId param provided, otherwise authenticated)
export async function GET(request: NextRequest) {
  const db = requireDb();
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId');

  // If userId is provided in query params, this is a public request
  if (userIdParam) {
    const snapshot = await db
      .collection('appointmentTypes')
      .where('userId', '==', userIdParam)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const appointmentTypes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return successResponse(appointmentTypes);
  }

  // Otherwise, use authenticated request
  return withAuth(async (req, { user }) => {
    const snapshot = await db
      .collection('appointmentTypes')
      .where('userId', '==', user.userId)
      .orderBy('createdAt', 'desc')
      .get();

    const appointmentTypes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return successResponse(appointmentTypes);
  })(request, { params: Promise.resolve({}) });
}

// POST - Create new appointment type
export const POST = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, appointmentTypeSchema);

  // Convert duration to number if string
  const durationMinutes = typeof data.durationMinutes === 'string'
    ? parseInt(data.durationMinutes)
    : data.durationMinutes;

  const appointmentType = {
    userId: user.userId,
    name: data.name,
    durationMinutes,
    description: data.description || '',
    color: data.color || '#3B82F6',
    bufferMinutes: data.bufferMinutes || 0,
    addGoogleMeet: data.addGoogleMeet || false,
    customQuestions: data.customQuestions || [],
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await db.collection('appointmentTypes').add(appointmentType);

  return successResponse({ id: docRef.id, ...appointmentType }, 201);
});
