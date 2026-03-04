import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import admin from '@/lib/firebase-admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withAuth(async (request, { user }) => {
  const db = admin.apps.length ? admin.firestore() : null;
  if (!db) {
    return errorResponse('Database not configured', 500);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400, 'VALIDATION_ERROR');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('Invalid file type. Allowed: JPEG, PNG, WebP, GIF', 400, 'VALIDATION_ERROR');
    }

    if (file.size > MAX_SIZE) {
      return errorResponse('File size exceeds 5MB limit', 400, 'VALIDATION_ERROR');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine extension
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const timestamp = Date.now();
    const storagePath = `users/${user.userId}/avatar/${timestamp}.${ext}`;

    // Upload to Firebase Storage
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

    // Make publicly accessible
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Update user profile
    await db.collection('users').doc(user.userId).update({
      avatarUrl: publicUrl,
      updatedAt: new Date().toISOString(),
    });

    return successResponse({ avatarUrl: publicUrl });
  } catch (error: unknown) {
    console.error('Avatar upload error:', error);
    return errorResponse('Failed to upload avatar', 500, 'UPLOAD_ERROR');
  }
});
