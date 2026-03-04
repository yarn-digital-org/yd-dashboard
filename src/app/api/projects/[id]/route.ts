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
  ForbiddenError
} from '@/lib/api-middleware';
import { Project, ProjectStatus, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactId: z.string().optional(),
  description: z.string().optional(),
  serviceType: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  location: z.string().optional(),
  quotedAmount: z.number().nullable().optional(),
  currency: z.string().optional(),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived']).optional(),
  workflowId: z.string().optional(),
  workflowTasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    order: z.number(),
    isCompleted: z.boolean(),
    completedAt: z.string().optional(),
    dueDate: z.string().optional(),
    subtasks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      isCompleted: z.boolean(),
    })),
    labels: z.array(z.string()),
  })).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const updateStatusSchema = z.object({
  action: z.literal('update_status'),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived']),
});

const updateTaskSchema = z.object({
  action: z.literal('update_task'),
  taskId: z.string(),
  isCompleted: z.boolean().optional(),
  subtaskId: z.string().optional(),
  subtaskCompleted: z.boolean().optional(),
});

// Status transition rules
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['active', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: [], // Final state
};

// ============================================
// GET - Get single project
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const params = await context.params;
  const { id } = params;

  const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Project not found');
  }

  const project = { id: doc.id, ...doc.data() } as Project;

  // Verify ownership
  if (project.userId !== user.userId) {
    throw new NotFoundError('Project not found');
  }

  // Optionally fetch related data
  const { searchParams } = new URL(request.url);
  const includeContact = searchParams.get('includeContact') === 'true';
  const includeNotes = searchParams.get('includeNotes') === 'true';
  const includeFiles = searchParams.get('includeFiles') === 'true';

  let contact = null;
  let notes: unknown[] = [];
  let files: unknown[] = [];

  if (includeContact && project.contactId) {
    const contactDoc = await db.collection(COLLECTIONS.CONTACTS).doc(project.contactId).get();
    if (contactDoc.exists) {
      contact = { id: contactDoc.id, ...contactDoc.data() };
    }
  }

  if (includeNotes) {
    const notesSnapshot = await db
      .collection(COLLECTIONS.PROJECT_NOTES)
      .where('projectId', '==', id)
      .where('userId', '==', user.userId)
      .orderBy('createdAt', 'desc')
      .get();
    notes = notesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  if (includeFiles) {
    const filesSnapshot = await db
      .collection(COLLECTIONS.PROJECT_FILES)
      .where('projectId', '==', id)
      .where('userId', '==', user.userId)
      .orderBy('uploadedAt', 'desc')
      .get();
    files = filesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  return successResponse({
    project,
    contact,
    notes,
    files,
  });
}

// ============================================
// PUT - Update project
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const params = await context.params;
  const { id } = params;

  // Get existing project
  const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Project not found');
  }

  const existingProject = doc.data() as Project;

  // Verify ownership
  if (existingProject.userId !== user.userId) {
    throw new NotFoundError('Project not found');
  }

  const data = await validateBody(request, updateProjectSchema);
  const now = new Date().toISOString();

  // If changing contact, verify new contact exists
  if (data.contactId && data.contactId !== existingProject.contactId) {
    const contactDoc = await db.collection(COLLECTIONS.CONTACTS).doc(data.contactId).get();
    if (!contactDoc.exists || contactDoc.data()?.userId !== user.userId) {
      throw new NotFoundError('Contact not found');
    }

    // Update old contact's projectCount
    await db.collection(COLLECTIONS.CONTACTS).doc(existingProject.contactId).update({
      projectCount: Math.max(0, ((await db.collection(COLLECTIONS.CONTACTS).doc(existingProject.contactId).get()).data()?.projectCount || 1) - 1),
      updatedAt: now,
    });

    // Update new contact's projectCount
    await db.collection(COLLECTIONS.CONTACTS).doc(data.contactId).update({
      projectCount: (contactDoc.data()?.projectCount || 0) + 1,
      updatedAt: now,
    });
  }

  // Build update object
  const updateData: Partial<Project> & { updatedAt: string } = {
    updatedAt: now,
  };

  // Only include fields that are explicitly provided
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.contactId !== undefined) updateData.contactId = data.contactId;
  if (data.description !== undefined) updateData.description = data.description?.trim();
  if (data.serviceType !== undefined) updateData.serviceType = data.serviceType?.trim();
  if (data.startDate !== undefined) updateData.startDate = data.startDate || undefined;
  if (data.endDate !== undefined) updateData.endDate = data.endDate || undefined;
  if (data.eventDate !== undefined) updateData.eventDate = data.eventDate || undefined;
  if (data.location !== undefined) updateData.location = data.location?.trim();
  if (data.quotedAmount !== undefined) updateData.quotedAmount = data.quotedAmount || undefined;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.workflowId !== undefined) updateData.workflowId = data.workflowId;
  if (data.workflowTasks !== undefined) updateData.workflowTasks = data.workflowTasks;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.customFields !== undefined) updateData.customFields = data.customFields;

  await docRef.update(updateData);

  return successResponse({
    ...existingProject,
    ...updateData,
    id,
  });
}

// ============================================
// PATCH - Update status or task
// ============================================

async function handlePatch(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const params = await context.params;
  const { id } = params;

  // Get existing project
  const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Project not found');
  }

  const existingProject = doc.data() as Project;

  // Verify ownership
  if (existingProject.userId !== user.userId) {
    throw new NotFoundError('Project not found');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ForbiddenError('Invalid JSON body');
  }

  const now = new Date().toISOString();

  // Handle status update
  if ((body as { action?: string })?.action === 'update_status') {
    const data = updateStatusSchema.parse(body);

    // Validate transition
    const validTransitions = VALID_TRANSITIONS[existingProject.status];
    if (!validTransitions.includes(data.status)) {
      throw new ForbiddenError(
        `Cannot transition from ${existingProject.status} to ${data.status}. Valid transitions: ${validTransitions.join(', ')}`
      );
    }

    await docRef.update({
      status: data.status,
      updatedAt: now,
    });

    return successResponse({
      id,
      status: data.status,
      updatedAt: now,
    });
  }

  // Handle task update
  if ((body as { action?: string })?.action === 'update_task') {
    const data = updateTaskSchema.parse(body);

    const tasks = [...(existingProject.workflowTasks || [])];
    const taskIndex = tasks.findIndex(t => t.id === data.taskId);

    if (taskIndex === -1) {
      throw new NotFoundError('Task not found');
    }

    if (data.subtaskId && data.subtaskCompleted !== undefined) {
      // Update subtask
      const subtaskIndex = tasks[taskIndex].subtasks.findIndex(s => s.id === data.subtaskId);
      if (subtaskIndex === -1) {
        throw new NotFoundError('Subtask not found');
      }
      tasks[taskIndex].subtasks[subtaskIndex].isCompleted = data.subtaskCompleted;
    } else if (data.isCompleted !== undefined) {
      // Update task
      tasks[taskIndex].isCompleted = data.isCompleted;
      tasks[taskIndex].completedAt = data.isCompleted ? now : undefined;
    }

    await docRef.update({
      workflowTasks: tasks,
      updatedAt: now,
    });

    return successResponse({
      id,
      workflowTasks: tasks,
      updatedAt: now,
    });
  }

  throw new ForbiddenError('Invalid action');
}

// ============================================
// DELETE - Delete/archive project
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const params = await context.params;
  const { id } = params;

  // Get existing project
  const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Project not found');
  }

  const existingProject = doc.data() as Project;

  // Verify ownership
  if (existingProject.userId !== user.userId) {
    throw new NotFoundError('Project not found');
  }

  const { searchParams } = new URL(request.url);
  const hardDelete = searchParams.get('hard') === 'true';

  const now = new Date().toISOString();

  if (hardDelete) {
    // Hard delete - also delete related notes and files
    const batch = db.batch();

    // Delete notes
    const notesSnapshot = await db
      .collection(COLLECTIONS.PROJECT_NOTES)
      .where('projectId', '==', id)
      .get();
    notesSnapshot.docs.forEach(d => batch.delete(d.ref));

    // Delete files
    const filesSnapshot = await db
      .collection(COLLECTIONS.PROJECT_FILES)
      .where('projectId', '==', id)
      .get();
    filesSnapshot.docs.forEach(d => batch.delete(d.ref));

    // Delete project
    batch.delete(docRef);

    // Update contact's projectCount
    const contactRef = db.collection(COLLECTIONS.CONTACTS).doc(existingProject.contactId);
    const contactDoc = await contactRef.get();
    if (contactDoc.exists) {
      batch.update(contactRef, {
        projectCount: Math.max(0, (contactDoc.data()?.projectCount || 1) - 1),
        updatedAt: now,
      });
    }

    await batch.commit();

    return successResponse({ deleted: true });
  } else {
    // Soft delete - archive
    await docRef.update({
      status: 'archived',
      updatedAt: now,
    });

    return successResponse({
      id,
      status: 'archived',
      updatedAt: now,
    });
  }
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PATCH = withAuth(handlePatch as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DELETE = withAuth(handleDelete as any);
