import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse, requireDb } from '@/lib/api-middleware';
import admin from '@/lib/firebase-admin';

// POST - Upload avatar to Firebase Storage
export const POST = withAuth(async (request: NextRequest, { user }) => {
  const db = requireDb();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400, 'VALIDATION_ERROR');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return errorResponse('File must be an image', 400, 'VALIDATION_ERROR');
    }

    // Validate file size (5MB limit for avatars)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return errorResponse('Image must be less than 5MB', 400, 'VALIDATION_ERROR');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store avatar at a predictable path (overwrites previous)
    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `users/${user.userId}/avatar.${ext}`;

    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          userId: user.userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Generate signed URL (long-lived for avatars — 365 days)
    const [avatarUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    // Update user profile in Firestore
    await db.collection('users').doc(user.userId).set(
      { avatarUrl, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    return successResponse({ avatarUrl }, 200);
  } catch (error: unknown) {
    console.error('Error uploading avatar:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Failed to upload avatar', 500, 'UPLOAD_ERROR', message);
  }
});
