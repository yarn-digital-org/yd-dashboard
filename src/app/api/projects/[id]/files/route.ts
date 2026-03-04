import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse, handleApiError, requireDb } from '@/lib/api-middleware';

// GET - List files for a project
export const GET = withAuth(async (request, { params, user }) => {
  const { id } = await params;
  const db = requireDb();

  // Verify project ownership
  const projectDoc = await db.collection('projects').doc(id).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== user.userId) {
    return errorResponse('Project not found', 404, 'NOT_FOUND');
  }

  const snapshot = await db.collection('projectFiles')
    .where('projectId', '==', id)
    .where('userId', '==', user.userId)
    .orderBy('createdAt', 'desc')
    .get();

  const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return successResponse(files);
});

// POST - Add file metadata
export const POST = withAuth(async (request, { params, user }) => {
  const { id } = await params;
  const db = requireDb();

  // Verify project ownership
  const projectDoc = await db.collection('projects').doc(id).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== user.userId) {
    return errorResponse('Project not found', 404, 'NOT_FOUND');
  }

  const body = await request.json();
  const { filename, url, mimeType, size, isShared } = body;

  if (!filename) {
    return errorResponse('Filename is required', 400, 'VALIDATION_ERROR');
  }

  const file = {
    projectId: id,
    userId: user.userId,
    filename,
    url: url || '',
    mimeType: mimeType || 'application/octet-stream',
    size: size || 0,
    isShared: isShared ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ref = await db.collection('projectFiles').add(file);
  return successResponse({ id: ref.id, ...file }, 201);
});
