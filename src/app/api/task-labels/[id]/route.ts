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
import { TaskLabel, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const updateLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format').optional(),
});

// ============================================
// Helper: Get label by ID
// ============================================

async function getLabel(db: FirebaseFirestore.Firestore, id: string, userId: string) {
  const doc = await db.collection(COLLECTIONS.TASK_LABELS).doc(id).get();
  
  if (!doc.exists) {
    throw new NotFoundError('Task label not found');
  }

  const label = { id: doc.id, ...doc.data() } as TaskLabel;
  
  if (label.userId !== userId) {
    throw new ForbiddenError('You do not have access to this label');
  }

  return label;
}

// ============================================
// GET - Get single task label
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const label = await getLabel(db, id, user.userId);

  return successResponse(label);
}

// ============================================
// PUT - Update task label
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  // Verify ownership
  await getLabel(db, id, user.userId);

  const data = await validateBody(request, updateLabelSchema);

  // Check for duplicate name if name is being changed
  if (data.name) {
    const existing = await db
      .collection(COLLECTIONS.TASK_LABELS)
      .where('userId', '==', user.userId)
      .where('name', '==', data.name.trim())
      .get();

    const duplicate = existing.docs.find(doc => doc.id !== id);
    if (duplicate) {
      throw new ValidationError('A label with this name already exists', {
        name: ['Duplicate label name'],
      });
    }
  }

  const updateData: Partial<TaskLabel> = {};

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.color !== undefined) updateData.color = data.color.toUpperCase();

  if (Object.keys(updateData).length === 0) {
    return successResponse(await getLabel(db, id, user.userId));
  }

  await db.collection(COLLECTIONS.TASK_LABELS).doc(id).update(updateData);

  const updated = await getLabel(db, id, user.userId);
  return successResponse(updated);
}

// ============================================
// DELETE - Delete task label
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  // Verify ownership
  await getLabel(db, id, user.userId);

  await db.collection(COLLECTIONS.TASK_LABELS).doc(id).delete();

  return successResponse({ deleted: true });
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
