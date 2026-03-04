import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse, requireDb } from '@/lib/api-middleware';
import admin from '@/lib/firebase-admin';

// DELETE - Remove a file from both Firestore and Firebase Storage
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

  // Delete from Firebase Storage if storagePath exists
  if (fileData.storagePath) {
    try {
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(fileData.storagePath);
      const [exists] = await fileRef.exists();
      if (exists) {
        await fileRef.delete();
      }
    } catch (error) {
      console.error('Error deleting file from Storage:', error);
      // Continue to delete metadata even if storage deletion fails
    }
  }

  // Delete metadata from Firestore
  await db.collection('projectFiles').doc(fileId).delete();
  return successResponse({ deleted: true });
});
