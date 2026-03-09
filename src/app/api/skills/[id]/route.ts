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

const updateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.enum(['Content', 'SEO', 'Development', 'Marketing', 'Design', 'Analytics', 'Operations']).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  agentIds: z.array(z.string()).optional(),
  source: z.enum(['internal', 'imported']).optional(),
});

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const doc = await db.collection(COLLECTIONS.SKILLS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Skill not found');
  }

  const skill = { id: doc.id, ...doc.data() };

  if ((skill as any).orgId !== user.userId) {
    throw new ForbiddenError('Access denied');
  }

  return successResponse(skill);
}

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  const body = await validateBody(request, updateSkillSchema);

  const docRef = db.collection(COLLECTIONS.SKILLS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Skill not found');
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

  const docRef = db.collection(COLLECTIONS.SKILLS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Skill not found');
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
