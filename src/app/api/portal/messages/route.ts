import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError, requireDb } from '@/lib/api-middleware';
import { validatePortalSession } from '../session/route';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('x-portal-token') || new URL(request.url).searchParams.get('token');
    if (!token) return errorResponse('Portal token required', 401, 'UNAUTHORIZED');

    const session = await validatePortalSession(token);
    if (!session) return errorResponse('Invalid session', 401, 'UNAUTHORIZED');

    const db = requireDb();
    const convSnapshot = await db.collection('conversations')
      .where('userId', '==', session.userId)
      .where('contactId', '==', session.contactId)
      .orderBy('lastMessageAt', 'desc')
      .limit(10)
      .get();

    const conversations = [];
    for (const doc of convSnapshot.docs) {
      const data = doc.data();
      // Get last few messages
      const msgSnapshot = await db.collection('messages')
        .where('conversationId', '==', doc.id)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      conversations.push({
        id: doc.id,
        subject: data.subject,
        lastMessageAt: data.lastMessageAt,
        messages: msgSnapshot.docs.map((m) => {
          const md = m.data();
          return {
            id: m.id,
            content: md.content,
            senderType: md.senderType,
            createdAt: md.createdAt,
          };
        }).reverse(),
      });
    }

    return successResponse(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Send a message from the portal
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-portal-token') || new URL(request.url).searchParams.get('token');
    if (!token) return errorResponse('Portal token required', 401, 'UNAUTHORIZED');

    const session = await validatePortalSession(token);
    if (!session) return errorResponse('Invalid session', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return errorResponse('conversationId and content required', 400, 'VALIDATION_ERROR');
    }

    const db = requireDb();

    // Verify conversation belongs to this contact
    const convDoc = await db.collection('conversations').doc(conversationId).get();
    if (!convDoc.exists || convDoc.data()?.contactId !== session.contactId) {
      return errorResponse('Conversation not found', 404, 'NOT_FOUND');
    }

    const message = {
      conversationId,
      userId: session.userId,
      content,
      senderType: 'client',
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection('messages').add(message);

    // Update conversation
    await db.collection('conversations').doc(conversationId).update({
      lastMessageAt: message.createdAt,
      lastMessagePreview: content.substring(0, 100),
    });

    return successResponse({ id: ref.id, ...message });
  } catch (error) {
    return handleApiError(error);
  }
}
