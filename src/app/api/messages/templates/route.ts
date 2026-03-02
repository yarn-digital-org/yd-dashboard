import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
} from '@/lib/api-middleware';

const templateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().max(500).optional(),
  body: z.string().min(1).max(10000),
  category: z.string().max(100).optional(),
});

// GET - List templates
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();
  const snapshot = await db
    .collection('messageTemplates')
    .where('userId', '==', user.userId)
    .orderBy('name')
    .get();

  const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return successResponse(templates);
});

// POST - Create template
export const POST = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, templateSchema);

  const now = new Date().toISOString();
  const templateData = {
    ...data,
    userId: user.userId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection('messageTemplates').add(templateData);
  return successResponse({ id: docRef.id, ...templateData });
});
