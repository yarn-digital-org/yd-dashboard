import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError, requireDb } from '@/lib/api-middleware';

// Helper to validate portal session from token
export async function validatePortalSession(token: string) {
  const db = requireDb();
  const snapshot = await db.collection('portalSessions')
    .where('token', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const session = snapshot.docs[0].data();
  if (new Date(session.expiresAt) < new Date()) {
    // Expired - clean up
    await db.collection('portalSessions').doc(snapshot.docs[0].id).delete();
    return null;
  }

  return { id: snapshot.docs[0].id, ...session } as {
    id: string;
    contactId: string;
    userId: string;
    token: string;
    expiresAt: string;
    createdAt: string;
  };
}

// GET - Validate portal session
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = request.headers.get('x-portal-token') || url.searchParams.get('token');
    if (!token) {
      return errorResponse('Portal token required', 401, 'UNAUTHORIZED');
    }

    const session = await validatePortalSession(token);
    if (!session) {
      return errorResponse('Invalid or expired session', 401, 'UNAUTHORIZED');
    }

    // Get contact info
    const db = requireDb();
    const contactDoc = await db.collection('contacts').doc(session.contactId).get();
    if (!contactDoc.exists) {
      return errorResponse('Contact not found', 404, 'NOT_FOUND');
    }

    const contact = contactDoc.data()!;
    return successResponse({
      session: { id: session.id, expiresAt: session.expiresAt },
      contact: {
        id: contactDoc.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        company: contact.company,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
