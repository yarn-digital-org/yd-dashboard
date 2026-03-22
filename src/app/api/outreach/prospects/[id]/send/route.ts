import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  resolveOrgId,
  successResponse,
  requireDb,
  AuthUser,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';
import { sendEmail } from '@/lib/email-service';

async function handlePost(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await context.params;
  const orgId = await resolveOrgId(context.user);

  const doc = await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).get();
  if (!doc.exists) throw new NotFoundError('Prospect not found');
  const prospect = { id: doc.id, ...doc.data() } as any;
  if (prospect.userId !== orgId) throw new ForbiddenError('Access denied');

  if (prospect.status !== 'approved') {
    throw new BadRequestError('Prospect must be approved before sending');
  }
  if (!prospect.draftMessage || !prospect.draftSubject) {
    throw new BadRequestError('Draft subject and message are required before sending');
  }

  const isEmail = prospect.contactMethod === 'email';
  const now = new Date().toISOString();

  if (isEmail && prospect.contactValue) {
    const result = await sendEmail({
      to: prospect.contactValue,
      subject: prospect.draftSubject,
      from: 'Jonny @ Yarn Digital <jonny@yarndigital.co.uk>',
      replyTo: 'jonny@yarndigital.co.uk',
      html: plainTextToHtml(prospect.draftMessage),
    });

    if (!result.success && !result.fallback) {
      throw new Error(result.error || 'Failed to send email');
    }

    await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update({
      status: 'sent', sentAt: now, updatedAt: now,
      sentVia: 'email', sentMessageId: result.messageId || null,
    });

    return successResponse({
      sent: true, via: 'email', to: prospect.contactValue,
      fallback: result.fallback || false, messageId: result.messageId,
    });
  }

  // Non-email: mark as sent manually
  await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update({
    status: 'sent', sentAt: now, updatedAt: now, sentVia: prospect.contactMethod,
  });

  return successResponse({
    sent: true, via: prospect.contactMethod, manual: true,
    note: `Mark as sent manually via ${prospect.contactMethod}. Contact: ${prospect.contactValue}`,
  });
}

function plainTextToHtml(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paragraphs = escaped.split(/\n\n+/).map(para => {
    const lines = para.split('\n').join('<br>');
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a;">${lines}</p>`;
  }).join('\n');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #eee;">
        <span style="font-size:20px;font-weight:700;color:#0a0a0a;">YARN</span><span style="color:#FF3300;font-size:20px;font-weight:700;">.</span><span style="font-size:13px;color:#666;margin-left:4px;">Digital</span>
      </div>
      <div>${paragraphs}</div>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee;">
        <p style="margin:0;font-size:12px;color:#999;">Yarn Digital · Tell Your Story | Web, Marketing & Search · yarndigital.co.uk</p>
      </div>
    </td></tr>
  </table>
</body></html>`;
}

export const POST = withAuth(handlePost);
