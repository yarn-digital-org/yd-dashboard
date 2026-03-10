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
import { Task, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['backlog', 'in-progress', 'review', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.union([z.string(), z.array(z.string())]).optional(),
  assignedToName: z.union([z.string(), z.array(z.string())]).optional(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringConfig: z.object({
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    nextDue: z.string().optional(),
  }).optional().nullable(),
  notes: z.string().optional(),
  feedbackNotes: z.string().optional(),
});

// ============================================
// GET - Get single task
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const orgId = await resolveOrgId(user);

  const doc = await db.collection(COLLECTIONS.TASKS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Task not found');
  }

  const task = { id: doc.id, ...doc.data() } as Task;

  if (task.orgId !== orgId) {
    throw new ForbiddenError('Access denied');
  }

  return successResponse(task);
}

// ============================================
// PUT - Update task
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  const data = await validateBody(request, updateTaskSchema);

  const orgId = await resolveOrgId(user);

  const doc = await db.collection(COLLECTIONS.TASKS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Task not found');
  }

  const existing = { id: doc.id, ...doc.data() } as Task;

  if (existing.orgId !== orgId) {
    throw new ForbiddenError('Access denied');
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: now,
  };

  if (data.title) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description.trim();

  // Normalize assignedTo/assignedToName to arrays if provided
  if (data.assignedTo !== undefined) {
    updates.assignedTo = Array.isArray(data.assignedTo) ? data.assignedTo : (data.assignedTo ? [data.assignedTo] : []);
  }
  if (data.assignedToName !== undefined) {
    updates.assignedToName = Array.isArray(data.assignedToName) ? data.assignedToName : (data.assignedToName ? [data.assignedToName] : []);
  }

  // Track completion
  if (data.status === 'done' && existing.status !== 'done') {
    updates.completedAt = now;

    // Update agent stats for all assigned agents
    const assignedIds = Array.isArray(existing.assignedTo) ? existing.assignedTo : (existing.assignedTo ? [existing.assignedTo] : []);
    for (const agentId of assignedIds) {
      if (!agentId) continue;
      try {
        const agentRef = db.collection(COLLECTIONS.AGENTS).doc(agentId);
        const agentDoc = await agentRef.get();
        if (agentDoc.exists) {
          const agentData = agentDoc.data();
          await agentRef.update({
            'stats.tasksCompleted': (agentData?.stats?.tasksCompleted || 0) + 1,
            'stats.tasksInProgress': Math.max(0, (agentData?.stats?.tasksInProgress || 0) - 1),
            updatedAt: now,
          });
        }
      } catch (e) {
        console.error('Agent stats update error:', e);
      }
    }
  }

  // If moving back from done
  if (data.status && data.status !== 'done' && existing.status === 'done') {
    updates.completedAt = null;
  }

  await db.collection(COLLECTIONS.TASKS).doc(id).update(updates);

  const updated = await db.collection(COLLECTIONS.TASKS).doc(id).get();

  return successResponse({ id: updated.id, ...updated.data() });
}

// ============================================
// DELETE - Delete task
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const orgId = await resolveOrgId(user);

  const doc = await db.collection(COLLECTIONS.TASKS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Task not found');
  }

  const task = { id: doc.id, ...doc.data() } as Task;

  if (task.orgId !== orgId) {
    throw new ForbiddenError('Access denied');
  }

  await db.collection(COLLECTIONS.TASKS).doc(id).delete();

  return successResponse({ message: 'Task deleted successfully' });
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
