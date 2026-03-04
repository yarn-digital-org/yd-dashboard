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
  NotFoundError
} from '@/lib/api-middleware';
import { ProjectNote, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const createNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  isShared: z.boolean().default(false),
});

// ============================================
// GET - List notes for project
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const params = await context.params;
  const { id: projectId } = params;

  // Verify project exists and belongs to user
  const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(projectId).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== user.userId) {
    throw new NotFoundError('Project not found');
  }

  const snapshot = await db
    .collection(COLLECTIONS.PROJECT_NOTES)
    .where('projectId', '==', projectId)
    .where('userId', '==', user.userId)
    .orderBy('createdAt', 'desc')
    .get();

  const notes = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return successResponse({ notes });
}

// ============================================
// POST - Create note for project
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const params = await context.params;
  const { id: projectId } = params;
  const data = await validateBody(request, createNoteSchema);

  // Verify project exists and belongs to user
  const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(projectId).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== user.userId) {
    throw new NotFoundError('Project not found');
  }

  const now = new Date().toISOString();

  const note: Omit<ProjectNote, 'id'> = {
    projectId,
    userId: user.userId,
    content: data.content.trim(),
    isShared: data.isShared,
    createdAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.PROJECT_NOTES).add(note);

  return successResponse(
    { id: docRef.id, ...note },
    201
  );
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
