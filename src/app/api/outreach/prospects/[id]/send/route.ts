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

// Jonny's userId — Gmail tokens are stored under this
const JONNY_USER_ID = '7d227bb7-f40d-49ef-8425-b765e894cc21';

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await (context.params as Promise<{ id: string }>);

  const doc = await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).get();
  if (!doc.exists) throw new NotFoundError('Prospect not found');
  const prospect = { id: doc.id, ...doc.data() } as any;
  // No ownership check — single-tenant dashboard, auth is sufficient

  if (prospect.status !== 'approved') {
    throw new BadRequestError('Prospect must be approved before sending');
  }
  if (!prospect.draftMessage || !prospect.draftSubject) {
    throw new BadRequestError('Draft subject and message are required before sending');
  }

  const isEmail = prospect.contactMethod === 'email';
  const now = new Date().toISOString();

  if (isEmail && prospect.contactValue) {
    // Send via Gmail (jonny@yarndigital.co.uk OAuth)
    try {
      await sendViaGmail(
        JONNY_USER_ID,
        prospect.contactValue,
        prospect.draftSubject,
        prospect.draftMessage
      );
    } catch (err: any) {
      console.error('Gmail send error:', err);
      // Return the error detail so UI shows the real reason
      return successResponse({
        sent: false,
        via: 'gmail',
        to: prospect.contactValue,
        manual: false,
        error: err?.message || 'Unknown Gmail error',
      });
    }

    await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update({
      status: 'sent',
      sentAt: now,
      updatedAt: now,
      sentVia: 'gmail',
    });

    return successResponse({
      sent: true,
      via: 'gmail',
      to: prospect.contactValue as string,
      manual: false,
      note: `Sent from jonny@yarndigital.co.uk via Gmail`,
    });
  }

  // Non-email: mark as sent manually
  await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update({
    status: 'sent',
    sentAt: now,
    updatedAt: now,
    sentVia: prospect.contactMethod,
  });

  return successResponse({
    sent: true,
    via: prospect.contactMethod as string,
    to: prospect.contactValue as string,
    manual: true,
    note: `Mark as sent manually via ${prospect.contactMethod}`,
  });
}

export const POST = withAuth(handlePost, { skipCSRF: true });
