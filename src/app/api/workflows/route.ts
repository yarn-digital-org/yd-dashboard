import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { 
  withAuth, 
  successResponse, 
  handleApiError,
  validateBody,
  requireDb,
  AuthUser,
  ValidationError
} from '@/lib/api-middleware';
import { WorkflowTemplate, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const subtaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Subtask name is required'),
});

const taskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Task name is required').max(200),
  description: z.string().optional(),
  order: z.number().min(0),
  dueDaysOffset: z.number().optional(),
  dueFrom: z.enum(['start_date', 'event_date']).default('start_date'),
  subtasks: z.array(subtaskSchema).default([]),
  labels: z.array(z.string()).default([]),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(100),
  description: z.string().max(500).optional(),
  serviceType: z.string().max(100).optional(),
  tasks: z.array(taskSchema).default([]),
  isDefault: z.boolean().optional(),
});

type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

// ============================================
// GET - List workflow templates
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { searchParams } = new URL(request.url);

  // Query parameters
  const search = searchParams.get('search')?.toLowerCase();
  const serviceType = searchParams.get('serviceType');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  // Base query - scoped to user
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.WORKFLOW_TEMPLATES)
    .where('userId', '==', user.userId)
    .orderBy(sortBy, sortOrder);

  const snapshot = await query.get();
  let workflows = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as WorkflowTemplate[];

  // Filter by service type
  if (serviceType) {
    workflows = workflows.filter(w => w.serviceType === serviceType);
  }

  // Search filter
  if (search) {
    workflows = workflows.filter(w =>
      w.name?.toLowerCase().includes(search) ||
      w.description?.toLowerCase().includes(search) ||
      w.serviceType?.toLowerCase().includes(search)
    );
  }

  // Calculate stats
  const stats = {
    total: workflows.length,
    byServiceType: workflows.reduce((acc, w) => {
      const key = w.serviceType || 'unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalTasks: workflows.reduce((acc, w) => acc + (w.tasks?.length || 0), 0),
  };

  // Pagination
  const total = workflows.length;
  workflows = workflows.slice(offset, offset + limit);

  return successResponse({
    workflows,
    stats,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + workflows.length < total,
    },
  });
}

// ============================================
// POST - Create new workflow template
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const data = await validateBody(request, createWorkflowSchema);

  // Check for duplicate name (within user's workflows)
  const existing = await db
    .collection(COLLECTIONS.WORKFLOW_TEMPLATES)
    .where('userId', '==', user.userId)
    .where('name', '==', data.name.trim())
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new ValidationError('A workflow with this name already exists', {
      name: ['Duplicate workflow name'],
    });
  }

  // If setting as default, unset other defaults for same service type
  if (data.isDefault && data.serviceType) {
    const defaultWorkflows = await db
      .collection(COLLECTIONS.WORKFLOW_TEMPLATES)
      .where('userId', '==', user.userId)
      .where('serviceType', '==', data.serviceType)
      .where('isDefault', '==', true)
      .get();

    const batch = db.batch();
    defaultWorkflows.docs.forEach((doc) => {
      batch.update(doc.ref, { isDefault: false, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  }

  const now = new Date().toISOString();

  const workflow: Omit<WorkflowTemplate, 'id'> = {
    userId: user.userId,
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    serviceType: data.serviceType?.trim() || undefined,
    tasks: data.tasks.map((task, index) => ({
      ...task,
      order: task.order ?? index,
    })),
    isDefault: data.isDefault || false,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.WORKFLOW_TEMPLATES).add(workflow);

  return successResponse(
    { id: docRef.id, ...workflow },
    201
  );
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
