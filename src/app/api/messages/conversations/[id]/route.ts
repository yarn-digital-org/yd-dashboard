import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  errorResponse,
  requireDb,
} from '@/lib/api-middleware';

const updateConversationSchema = z.object({
  isMuted: z.boolean().optional(),
  unreadCount: z.number().min(0).optional(),
});

// GET - Single conversation
export const GET = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;
  const doc = await db.collection('conversations').doc(id).get();

  if (!doc.exists || doc.data()?.userId !== user.userId) {
    return errorResponse('Conversation not found', 404);
  }

  // Get contact info
  const contactDoc = await db.collection('contacts').doc(doc.data()!.contactId).get();

  return successResponse({
    id: doc.id,
    ...doc.data(),
    contact: contactDoc.exists ? { id: contactDoc.id, ...contactDoc.data() } : null,
  });
});

// PATCH - Update conversation (mute, mark read)
export const PATCH = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;
  const doc = await db.collection('conversations').doc(id).get();

  if (!doc.exists || doc.data()?.userId !== user.userId) {
    return errorResponse('Conversation not found', 404);
  }

  const data = await validateBody(request, updateConversationSchema);

  await db.collection('conversations').doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });

  return successResponse({ id, ...doc.data(), ...data });
});

// DELETE - Delete conversation and its messages
export const DELETE = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;
  const doc = await db.collection('conversations').doc(id).get();

  if (!doc.exists || doc.data()?.userId !== user.userId) {
    return errorResponse('Conversation not found', 404);
  }

  // Delete all messages in conversation
  const messages = await db
    .collection('messages')
    .where('conversationId', '==', id)
    .get();

  const batch = db.batch();
  messages.docs.forEach(msgDoc => batch.delete(msgDoc.ref));
  batch.delete(doc.ref);
  await batch.commit();

  return successResponse({ deleted: true });
});
