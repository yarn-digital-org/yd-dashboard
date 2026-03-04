import { NextRequest, NextResponse } from 'next/server';
import { withAuth, errorResponse, requireDb } from '@/lib/api-middleware';
import admin from '@/lib/firebase-admin';

// GET - Download file from Firebase Storage
export const GET = withAuth(async (request, { params, user }): Promise<any> => {
  const { id, fileId } = await params;
  const db = requireDb();

  try {
    // Get file metadata from Firestore
    const fileDoc = await db.collection('projectFiles').doc(fileId).get();

    if (!fileDoc.exists) {
      return errorResponse('File not found', 404, 'NOT_FOUND');
    }

    const fileData = fileDoc.data();

    // Verify ownership or shared access
    if (fileData?.userId !== user.userId && !fileData?.isShared) {
      return errorResponse('Access denied', 403, 'FORBIDDEN');
    }

    // Verify project ID matches
    if (fileData?.projectId !== id) {
      return errorResponse('File does not belong to this project', 403, 'FORBIDDEN');
    }

    // Get file from Firebase Storage
    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(fileData.storagePath);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return errorResponse('File not found in storage', 404, 'NOT_FOUND');
    }

    // Get file contents
    const [fileBuffer] = await fileRef.download();

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': fileData.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileData.filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error downloading file:', error);
    return errorResponse(
      'Failed to download file',
      500,
      'DOWNLOAD_ERROR',
      error.message
    );
  }
});
