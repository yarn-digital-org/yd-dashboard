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
    const snapshot = await db.collection('invoices')
      .where('userId', '==', session.userId)
      .where('contactId', '==', session.contactId)
      .orderBy('createdAt', 'desc')
      .get();

    const invoices = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        invoiceNumber: data.invoiceNumber,
        total: data.total,
        amountPaid: data.amountPaid,
        balanceDue: data.balanceDue,
        status: data.status,
        dueDate: data.dueDate,
        currency: data.currency || 'AUD',
        createdAt: data.createdAt,
      };
    });

    return successResponse(invoices);
  } catch (error) {
    return handleApiError(error);
  }
}
