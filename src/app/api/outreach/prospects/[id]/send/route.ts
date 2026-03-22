import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  successResponse,
  requireDb,
  AuthUser,
  NotFoundError,
  BadRequestError,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';
import { sendEmail as sendViaGmail } from '@/lib/gmail';

const JONNY_USER_ID = '7d227bb7-f40d-49ef-8425-b765e894cc21';

interface SendResult {
  sent: boolean;
  via: string;
  to: string;
  manual: boolean;
  error?: string;
  note?: string;
}

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await (context.params as Promise<{ id: string }>);

  const doc = await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).get();
  if (!doc.exists) throw new NotFoundError('Prospect not found');
  const prospect = doc.data() as any;

  if (prospect.status !== 'approved') {
    throw new BadRequestError('Prospect must be approved before sending');
  }
  if (!prospect.draftMessage || !prospect.draftSubject) {
    throw new BadRequestError('Draft subject and message are required');
  }

  const isEmail = prospect.contactMethod === 'email';
  const now = new Date().toISOString();

  if (isEmail && prospect.contactValue) {
    try {
      await sendViaGmail(
        JONNY_USER_ID,
        prospect.contactValue,
        prospect.draftSubject,
        prospect.draftMessage
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Gmail error';
      console.error('Gmail send error:', msg);
      const result: SendResult = { sent: false, via: 'gmail', to: prospect.contactValue, manual: false, error: msg };
      return successResponse(result);
    }

    await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update({
      status: 'sent', sentAt: now, updatedAt: now, sentVia: 'gmail',
    });

    const result: SendResult = { sent: true, via: 'gmail', to: prospect.contactValue, manual: false, note: 'Sent via Gmail' };
    return successResponse(result);
  }

  // Non-email: mark as sent manually
  await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update({
    status: 'sent', sentAt: now, updatedAt: now, sentVia: prospect.contactMethod,
  });

  const result: SendResult = { sent: true, via: prospect.contactMethod, to: prospect.contactValue, manual: true, note: `Sent manually via ${prospect.contactMethod}` };
  return successResponse(result);
}

export const POST = withAuth(handlePost, { skipCSRF: true });
