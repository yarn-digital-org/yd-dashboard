import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  errorResponse,
  requireDb,
} from '@/lib/api-middleware';

const sendMessageSchema = z.object({
  body: z.string().min(1, 'Message body is required').max(10000),
  subject: z.string().max(500).optional(),
  channel: z.enum(['email', 'live_chat']).default('live_chat'),
});

// GET - List messages in a conversation
export const GET = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;

  // Verify conversation ownership
  const convDoc = await db.collection('conversations').doc(id).get();
  if (!convDoc.exists || convDoc.data()?.userId !== user.userId) {
    return errorResponse('Conversation not found', 404);
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const before = searchParams.get('before');

  let query = db
    .collection('messages')
    .where('conversationId', '==', id)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (before) {
    query = query.where('createdAt', '<', before);
  }

  const snapshot = await query.get();
  const messages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Mark conversation as read
  await db.collection('conversations').doc(id).update({ unreadCount: 0 });

  return successResponse(messages.reverse());
});

// POST - Send a message
export const POST = withAuth(async (request, { user, params }) => {
  const db = requireDb();
  const { id } = await params;

  // Verify conversation ownership
  const convDoc = await db.collection('conversations').doc(id).get();
  if (!convDoc.exists || convDoc.data()?.userId !== user.userId) {
    return errorResponse('Conversation not found', 404);
  }

  const data = await validateBody(request, sendMessageSchema);

  const now = new Date().toISOString();
  const messageData = {
    conversationId: id,
    userId: user.userId,
    contactId: convDoc.data()!.contactId,
    direction: 'outbound' as const,
    channel: data.channel,
    subject: data.subject || null,
    body: data.body,
    bodyHtml: null,
    attachments: [],
    status: 'sent' as const,
    sentAt: now,
    readAt: null,
    externalMessageId: null,
    createdAt: now,
  };

  const docRef = await db.collection('messages').add(messageData);

  // Update conversation preview
  await db.collection('conversations').doc(id).update({
    lastMessageAt: now,
    lastMessagePreview: data.body.substring(0, 100),
  });

  return successResponse({ id: docRef.id, ...messageData });
});
