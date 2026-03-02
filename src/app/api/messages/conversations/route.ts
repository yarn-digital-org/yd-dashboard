import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
} from '@/lib/api-middleware';

const createConversationSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
});

// GET - List conversations
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();
  const snapshot = await db
    .collection('conversations')
    .where('userId', '==', user.userId)
    .orderBy('lastMessageAt', 'desc')
    .get();

  const conversations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Enrich with contact names
  const contactIds = [...new Set(conversations.map((c: any) => c.contactId))];
  const contactMap: Record<string, any> = {};

  if (contactIds.length > 0) {
    // Firestore 'in' queries limited to 30
    for (let i = 0; i < contactIds.length; i += 30) {
      const batch = contactIds.slice(i, i + 30);
      const contactSnap = await db
        .collection('contacts')
        .where('__name__', 'in', batch)
        .get();
      contactSnap.docs.forEach(doc => {
        contactMap[doc.id] = { id: doc.id, ...doc.data() };
      });
    }
  }

  const enriched = conversations.map((conv: any) => ({
    ...conv,
    contact: contactMap[conv.contactId] || null,
  }));

  return successResponse(enriched);
});

// POST - Create conversation
export const POST = withAuth(async (request, { user }) => {
  const db = requireDb();
  const data = await validateBody(request, createConversationSchema);

  // Check if conversation already exists with this contact
  const existing = await db
    .collection('conversations')
    .where('userId', '==', user.userId)
    .where('contactId', '==', data.contactId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return successResponse({ id: existing.docs[0].id, ...existing.docs[0].data() });
  }

  const now = new Date().toISOString();
  const conversationData = {
    userId: user.userId,
    contactId: data.contactId,
    lastMessageAt: now,
    lastMessagePreview: '',
    unreadCount: 0,
    isMuted: false,
    createdAt: now,
  };

  const docRef = await db.collection('conversations').add(conversationData);

  return successResponse({ id: docRef.id, ...conversationData });
});
