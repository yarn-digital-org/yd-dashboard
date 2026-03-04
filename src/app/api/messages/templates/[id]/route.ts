import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  errorResponse,
  requireDb,
} from '@/lib/api-middleware';

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().min(1).max(10000).optional(),
  category: z.string().max(100).optional(),
});

// GET
export const GET = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;
  const doc = await db.collection('messageTemplates').doc(id).get();

  if (!doc.exists || doc.data()?.userId !== user.userId) {
    return errorResponse('Template not found', 404);
  }

  return successResponse({ id: doc.id, ...doc.data() });
});

// PATCH
export const PATCH = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;
  const doc = await db.collection('messageTemplates').doc(id).get();

  if (!doc.exists || doc.data()?.userId !== user.userId) {
    return errorResponse('Template not found', 404);
  }

  const data = await validateBody(request, updateTemplateSchema);

  await db.collection('messageTemplates').doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });

  return successResponse({ id, ...doc.data(), ...data });
});

// DELETE
export const DELETE = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;
  const doc = await db.collection('messageTemplates').doc(id).get();

  if (!doc.exists || doc.data()?.userId !== user.userId) {
    return errorResponse('Template not found', 404);
  }

  await db.collection('messageTemplates').doc(id).delete();
  return successResponse({ deleted: true });
});
