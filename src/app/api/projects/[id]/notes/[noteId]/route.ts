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
import { COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const updateNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000).optional(),
  isShared: z.boolean().optional(),
});

// ============================================
// PUT - Update note
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const params = await context.params;
  const { id: projectId, noteId } = params;
  const data = await validateBody(request, updateNoteSchema);

  // Verify project exists and belongs to user
  const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(projectId).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== user.userId) {
    throw new NotFoundError('Project not found');
  }

  // Get existing note
  const noteRef = db.collection(COLLECTIONS.PROJECT_NOTES).doc(noteId);
  const noteDoc = await noteRef.get();

  if (!noteDoc.exists) {
    throw new NotFoundError('Note not found');
  }

  const existingNote = noteDoc.data();
  if (existingNote?.userId !== user.userId || existingNote?.projectId !== projectId) {
    throw new NotFoundError('Note not found');
  }

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    updatedAt: now,
  };

  if (data.content !== undefined) updateData.content = data.content.trim();
  if (data.isShared !== undefined) updateData.isShared = data.isShared;

  await noteRef.update(updateData);

  return successResponse({
    id: noteId,
    ...existingNote,
    ...updateData,
  });
}

// ============================================
// DELETE - Delete note
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const params = await context.params;
  const { id: projectId, noteId } = params;

  // Verify project exists and belongs to user
  const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(projectId).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== user.userId) {
    throw new NotFoundError('Project not found');
  }

  // Get existing note
  const noteRef = db.collection(COLLECTIONS.PROJECT_NOTES).doc(noteId);
  const noteDoc = await noteRef.get();

  if (!noteDoc.exists) {
    throw new NotFoundError('Note not found');
  }

  const existingNote = noteDoc.data();
  if (existingNote?.userId !== user.userId || existingNote?.projectId !== projectId) {
    throw new NotFoundError('Note not found');
  }

  await noteRef.delete();

  return successResponse({ deleted: true });
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
