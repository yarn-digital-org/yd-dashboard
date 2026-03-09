import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  successResponse,
  handleApiError,
  validateBody,
  requireDb,
  NotFoundError,
  ForbiddenError,
  AuthUser,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

const contactSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().min(1),
  status: z.string().min(1),
  description: z.string(),
});

const updateClientDocSchema = z.object({
  clientName: z.string().min(1).max(200).optional(),
  industry: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'prospect', 'past']).optional(),
  overview: z.string().optional(),
  contacts: z.array(contactSchema).optional(),
  projects: z.array(projectSchema).optional(),
  meetingNotes: z.string().optional(),
});

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const doc = await db.collection(COLLECTIONS.CLIENT_DOCS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Client doc not found');
  }

  const clientDoc = { id: doc.id, ...doc.data() };

  if ((clientDoc as any).orgId !== user.userId) {
    throw new ForbiddenError('Access denied');
  }

  return successResponse(clientDoc);
}

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  const body = await validateBody(request, updateClientDocSchema);

  const docRef = db.collection(COLLECTIONS.CLIENT_DOCS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Client doc not found');
  }

  if (doc.data()?.orgId !== user.userId) {
    throw new ForbiddenError('Access denied');
  }

  const updateData = {
    ...body,
    updatedAt: new Date().toISOString(),
  };

  await docRef.update(updateData);

  return successResponse({ id, ...doc.data(), ...updateData });
}

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const docRef = db.collection(COLLECTIONS.CLIENT_DOCS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Client doc not found');
  }

  if (doc.data()?.orgId !== user.userId) {
    throw new ForbiddenError('Access denied');
  }

  await docRef.delete();

  return successResponse({ deleted: true });
}

export const GET = withAuth(handleGet, { skipCSRF: true });
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
