import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse, requireDb } from '@/lib/api-middleware';

// DELETE - Remove a file
export const DELETE = withAuth(async (request, { params, user }) => {
  const { id, fileId } = await params;
  const db = requireDb();

  const fileDoc = await db.collection('projectFiles').doc(fileId).get();
  if (!fileDoc.exists) {
    return errorResponse('File not found', 404, 'NOT_FOUND');
  }

  const fileData = fileDoc.data()!;
  if (fileData.userId !== user.userId || fileData.projectId !== id) {
    return errorResponse('File not found', 404, 'NOT_FOUND');
  }

  await db.collection('projectFiles').doc(fileId).delete();
  return successResponse({ deleted: true });
});
