import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, handleApiError, requireDb } from '@/lib/api-middleware';
function generateToken(): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// POST - Portal login (client enters email, gets session token)
export async function POST(request: NextRequest) {
  try {
    const db = requireDb();
    const body = await request.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return errorResponse('Email and userId are required', 400, 'VALIDATION_ERROR');
    }

    // Find contact by email belonging to this business owner
    const contactSnapshot = await db.collection('contacts')
      .where('userId', '==', userId)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (contactSnapshot.empty) {
      return errorResponse('No account found with this email', 404, 'NOT_FOUND');
    }

    const contact = contactSnapshot.docs[0];
    const contactData = contact.data();

    // Check if portal is enabled for this business
    const portalSnapshot = await db.collection('portalSettings')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (portalSnapshot.empty || !portalSnapshot.docs[0].data().enabled) {
      return errorResponse('Client portal is not enabled', 403, 'PORTAL_DISABLED');
    }

    // Create portal session
    const token = generateToken();
    const session = {
      contactId: contact.id,
      userId: userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      createdAt: new Date().toISOString(),
    };

    const sessionRef = await db.collection('portalSessions').add(session);

    // Log activity
    await db.collection('portalActivity').add({
      contactId: contact.id,
      userId: userId,
      action: 'login',
      createdAt: new Date().toISOString(),
    });

    return successResponse({
      token,
      sessionId: sessionRef.id,
      contact: {
        id: contact.id,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
