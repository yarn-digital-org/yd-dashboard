import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  successResponse,
  validateBody,
  requireDb,
  AuthUser,
  NotFoundError,
  ForbiddenError,
  resolveOrgId,
} from '@/lib/api-middleware';
import { Agent, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(200).optional(),
  avatar: z.string().optional(),
  status: z.enum(['active', 'idle', 'offline']).optional(),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
  slackChannel: z.string().optional().nullable(),
  personality: z.string().optional(),
});

// ============================================
// GET - Get single agent
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const orgId = await resolveOrgId(user);

  const doc = await db.collection(COLLECTIONS.AGENTS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Agent not found');
  }

  const agent = { id: doc.id, ...doc.data() } as Agent;

  if (agent.orgId !== orgId) {
    throw new ForbiddenError('Access denied');
  }

  return successResponse(agent);
}

// ============================================
// PUT - Update agent
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  const data = await validateBody(request, updateAgentSchema);

  const orgId = await resolveOrgId(user);

  const doc = await db.collection(COLLECTIONS.AGENTS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Agent not found');
  }

  const existing = { id: doc.id, ...doc.data() } as Agent;

  if (existing.orgId !== orgId) {
    throw new ForbiddenError('Access denied');
  }

  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (data.name) updates.name = data.name.trim();
  if (data.role) updates.role = data.role.trim();
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.personality !== undefined) updates.personality = data.personality.trim();

  await db.collection(COLLECTIONS.AGENTS).doc(id).update(updates);

  const updated = await db.collection(COLLECTIONS.AGENTS).doc(id).get();

  return successResponse({ id: updated.id, ...updated.data() });
}

// ============================================
// DELETE - Delete agent
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const orgId = await resolveOrgId(user);

  const doc = await db.collection(COLLECTIONS.AGENTS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Agent not found');
  }

  const agent = { id: doc.id, ...doc.data() } as Agent;

  if (agent.orgId !== orgId) {
    throw new ForbiddenError('Access denied');
  }

  await db.collection(COLLECTIONS.AGENTS).doc(id).delete();

  return successResponse({ message: 'Agent deleted successfully' });
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
