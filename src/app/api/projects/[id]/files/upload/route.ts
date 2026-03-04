import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse, requireDb } from '@/lib/api-middleware';
import admin from '@/lib/firebase-admin';

// POST - Upload actual file to Firebase Storage
export const POST = withAuth(async (request, { params, user }) => {
  const { id } = await params;
  const db = requireDb();

  // Verify project ownership
  const projectDoc = await db.collection('projects').doc(id).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== user.userId) {
    return errorResponse('Project not found', 404, 'NOT_FOUND');
  }

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400, 'VALIDATION_ERROR');
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return errorResponse('File size exceeds 10MB limit', 400, 'VALIDATION_ERROR');
    }

    // Get file data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine storage path
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `users/${user.userId}/projects/${id}/files/${timestamp}_${sanitizedFilename}`;

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || 'application/octet-stream',
        metadata: {
          userId: user.userId,
          projectId: id,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly accessible (or signed URL for private)
    // For now, generate a signed URL valid for 7 days
    const [downloadUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Store metadata in Firestore
    const fileMetadata = {
      projectId: id,
      userId: user.userId,
      filename: file.name,
      storagePath,
      downloadUrl,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      isShared: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await db.collection('projectFiles').add(fileMetadata);

    return successResponse(
      {
        id: ref.id,
        ...fileMetadata,
      },
      201
    );
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return errorResponse(
      'Failed to upload file',
      500,
      'UPLOAD_ERROR',
      error.message
    );
  }
});
