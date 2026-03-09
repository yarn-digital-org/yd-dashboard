import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  successResponse,
  validateBody,
  requireDb,
  AuthUser,
  resolveOrgId,
} from '@/lib/api-middleware';
import { Task, TaskStatus, TaskPriority, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['backlog', 'in-progress', 'review', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  assignedToName: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringConfig: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    nextDue: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

// ============================================
// GET - List tasks with filtering
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status') as TaskStatus | null;
  const priority = searchParams.get('priority') as TaskPriority | null;
  const assignedTo = searchParams.get('assignedTo');
  const isRecurring = searchParams.get('isRecurring');
  const search = searchParams.get('search')?.toLowerCase();
  const limit = parseInt(searchParams.get('limit') || '200');
  const offset = parseInt(searchParams.get('offset') || '0');

  const orgId = await resolveOrgId(user);

  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.TASKS)
    .where('orgId', '==', orgId);

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  let tasks = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];

  // Sort client-side to avoid composite index requirement
  tasks.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  // Post-query filters
  if (priority) {
    tasks = tasks.filter(t => t.priority === priority);
  }

  if (assignedTo) {
    tasks = tasks.filter(t => t.assignedTo === assignedTo);
  }

  if (isRecurring !== null && isRecurring !== undefined) {
    const recurring = isRecurring === 'true';
    tasks = tasks.filter(t => t.isRecurring === recurring);
  }

  if (search) {
    tasks = tasks.filter(t =>
      t.title?.toLowerCase().includes(search) ||
      t.description?.toLowerCase().includes(search) ||
      t.assignedToName?.toLowerCase().includes(search)
    );
  }

  // Stats
  const stats = {
    total: tasks.length,
    byStatus: {
      backlog: tasks.filter(t => t.status === 'backlog').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      archived: tasks.filter(t => t.status === 'archived').length,
    },
    byPriority: {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    },
  };

  // Pagination
  const total = tasks.length;
  tasks = tasks.slice(offset, offset + limit);

  return successResponse({
    tasks,
    stats,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + tasks.length < total,
    },
  });
}

// ============================================
// POST - Create new task
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const data = await validateBody(request, createTaskSchema);

  const now = new Date().toISOString();
  const orgId = await resolveOrgId(user);

  const task: Omit<Task, 'id'> = {
    title: data.title.trim(),
    description: data.description?.trim() || '',
    status: data.status || 'backlog',
    priority: data.priority || 'medium',
    assignedTo: data.assignedTo || '',
    assignedToName: data.assignedToName || 'Unassigned',
    projectId: data.projectId || undefined,
    clientId: data.clientId || undefined,
    labels: data.labels || [],
    dueDate: data.dueDate || undefined,
    isRecurring: data.isRecurring || false,
    recurringConfig: data.recurringConfig || undefined,
    createdAt: now,
    updatedAt: now,
    orgId: orgId,
    notes: data.notes || '',
  };

  const docRef = await db.collection(COLLECTIONS.TASKS).add(task);

  // Update agent stats if assigned
  if (task.assignedTo) {
    try {
      const agentRef = db.collection(COLLECTIONS.AGENTS).doc(task.assignedTo);
      const agentDoc = await agentRef.get();
      if (agentDoc.exists) {
        const agentData = agentDoc.data();
        const currentInProgress = agentData?.stats?.tasksInProgress || 0;
        await agentRef.update({
          'stats.tasksInProgress': currentInProgress + 1,
          updatedAt: now,
        });
      }
    } catch (e) {
      console.error('Agent stats update error:', e);
    }
  }

  return successResponse(
    { id: docRef.id, ...task },
    201
  );
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
