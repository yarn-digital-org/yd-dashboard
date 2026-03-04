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
import { TaskLabel, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
});

type CreateLabelInput = z.infer<typeof createLabelSchema>;

// ============================================
// GET - List task labels
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const snapshot = await db
    .collection(COLLECTIONS.TASK_LABELS)
    .where('userId', '==', user.userId)
    .orderBy('name', 'asc')
    .get();

  const labels = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as TaskLabel[];

  return successResponse({
    labels,
    total: labels.length,
  });
}

// ============================================
// POST - Create new task label
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const data = await validateBody(request, createLabelSchema);

  // Check for duplicate name (within user's labels)
  const existing = await db
    .collection(COLLECTIONS.TASK_LABELS)
    .where('userId', '==', user.userId)
    .where('name', '==', data.name.trim())
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new ValidationError('A label with this name already exists', {
      name: ['Duplicate label name'],
    });
  }

  const now = new Date().toISOString();

  const label: Omit<TaskLabel, 'id'> = {
    userId: user.userId,
    name: data.name.trim(),
    color: data.color.toUpperCase(),
    createdAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.TASK_LABELS).add(label);

  return successResponse(
    { id: docRef.id, ...label },
    201
  );
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
