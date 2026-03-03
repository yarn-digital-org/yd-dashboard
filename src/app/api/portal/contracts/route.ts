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
    const snapshot = await db.collection('contracts')
      .where('userId', '==', session.userId)
      .where('contactId', '==', session.contactId)
      .orderBy('createdAt', 'desc')
      .get();

    const contracts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        status: data.status,
        signers: data.signers || [],
        createdAt: data.createdAt,
      };
    });

    return successResponse(contracts);
  } catch (error) {
    return handleApiError(error);
  }
}
