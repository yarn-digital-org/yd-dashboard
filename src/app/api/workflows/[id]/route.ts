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
  NotFoundError,
  ForbiddenError,
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

const updateWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  serviceType: z.string().max(100).optional().nullable(),
  tasks: z.array(taskSchema).optional(),
  isDefault: z.boolean().optional(),
});

// ============================================
// Helper: Get workflow by ID
// ============================================

async function getWorkflow(db: FirebaseFirestore.Firestore, id: string, userId: string) {
  const doc = await db.collection(COLLECTIONS.WORKFLOW_TEMPLATES).doc(id).get();
  
  if (!doc.exists) {
    throw new NotFoundError('Workflow template not found');
  }

  const workflow = { id: doc.id, ...doc.data() } as WorkflowTemplate;
  
  if (workflow.userId !== userId) {
    throw new ForbiddenError('You do not have access to this workflow');
  }

  return workflow;
}

// ============================================
// GET - Get single workflow template
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const workflow = await getWorkflow(db, id, user.userId);

  return successResponse(workflow);
}

// ============================================
// PUT - Update workflow template
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  // Verify ownership
  await getWorkflow(db, id, user.userId);

  const data = await validateBody(request, updateWorkflowSchema);

  // Check for duplicate name if name is being changed
  if (data.name) {
    const existing = await db
      .collection(COLLECTIONS.WORKFLOW_TEMPLATES)
      .where('userId', '==', user.userId)
      .where('name', '==', data.name.trim())
      .get();

    const duplicate = existing.docs.find(doc => doc.id !== id);
    if (duplicate) {
      throw new ValidationError('A workflow with this name already exists', {
        name: ['Duplicate workflow name'],
      });
    }
  }

  // If setting as default, unset other defaults for same service type
  if (data.isDefault) {
    const currentDoc = await db.collection(COLLECTIONS.WORKFLOW_TEMPLATES).doc(id).get();
    const currentData = currentDoc.data();
    const serviceType = data.serviceType ?? currentData?.serviceType;

    if (serviceType) {
      const defaultWorkflows = await db
        .collection(COLLECTIONS.WORKFLOW_TEMPLATES)
        .where('userId', '==', user.userId)
        .where('serviceType', '==', serviceType)
        .where('isDefault', '==', true)
        .get();

      const batch = db.batch();
      defaultWorkflows.docs.forEach((doc) => {
        if (doc.id !== id) {
          batch.update(doc.ref, { isDefault: false, updatedAt: new Date().toISOString() });
        }
      });
      await batch.commit();
    }
  }

  const updateData: Partial<WorkflowTemplate> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || undefined;
  if (data.serviceType !== undefined) updateData.serviceType = data.serviceType?.trim() || undefined;
  if (data.tasks !== undefined) {
    updateData.tasks = data.tasks.map((task, index) => ({
      ...task,
      order: task.order ?? index,
    }));
  }
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

  await db.collection(COLLECTIONS.WORKFLOW_TEMPLATES).doc(id).update(updateData);

  const updated = await getWorkflow(db, id, user.userId);
  return successResponse(updated);
}

// ============================================
// DELETE - Delete workflow template
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  // Verify ownership
  await getWorkflow(db, id, user.userId);

  await db.collection(COLLECTIONS.WORKFLOW_TEMPLATES).doc(id).delete();

  return successResponse({ deleted: true });
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
