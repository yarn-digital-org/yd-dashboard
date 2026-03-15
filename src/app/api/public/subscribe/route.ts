/**
 * Public subscribe endpoint — double opt-in support
 * 
 * POST /api/public/subscribe  — subscribe email to a list (sends confirmation email)
 * GET  /api/public/subscribe?token=<token>  — confirm subscription (double opt-in)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmailWithFallback } from '@/lib/email-service';
import { createHmac } from 'crypto';

const CONFIRM_SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || 'confirm-secret';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yd-dashboard.vercel.app';

function generateConfirmToken(email: string, listId: string): string {
  const payload = `confirm:${email}:${listId}`;
  const sig = createHmac('sha256', CONFIRM_SECRET).update(payload).digest('hex').slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

function verifyConfirmToken(token: string): { email: string; listId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 4 || parts[0] !== 'confirm') return null;
    const sig = parts.pop()!;
    const listId = parts.pop()!;
    const email = parts.slice(1).join(':');
    const expectedSig = createHmac('sha256', CONFIRM_SECRET).update(`confirm:${email}:${listId}`).digest('hex').slice(0, 16);
    if (sig !== expectedSig) return null;
    return { email, listId };
  } catch {
    return null;
  }
}

/** POST — subscribe request, sends confirmation email */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, listId, name, doubleOptIn = true } = body;

    if (!email || !listId) {
      return NextResponse.json({ error: 'email and listId required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const now = new Date().toISOString();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Check list exists
    const listDoc = await adminDb.collection('emailLists').doc(listId).get();
    if (!listDoc.exists) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    const list = listDoc.data();

    if (doubleOptIn) {
      // Generate confirmation token and send email
      const token = generateConfirmToken(email, listId);
      const confirmUrl = `${APP_URL}/api/public/subscribe?token=${token}`;

      await sendEmailWithFallback({
        to: email,
        subject: `Confirm your subscription to ${list?.name || 'our mailing list'}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td style="background:#ffffff;border-radius:12px;padding:40px;">
      <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#0A0A0A;">YARN<span style="color:#FF3300;">.</span> Dashboard</h1>
      ${name ? `<p style="margin:0 0 16px;font-size:16px;color:#0A0A0A;">Hi ${name},</p>` : ''}
      <p style="margin:0 0 16px;font-size:16px;color:#4A4A4A;line-height:1.5;">Please confirm your subscription to <strong>${list?.name || 'our mailing list'}</strong>.</p>
      <a href="${confirmUrl}" style="display:inline-block;background:#FF3300;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:500;margin-bottom:24px;">Confirm Subscription</a>
      <p style="margin:24px 0 0;font-size:14px;color:#7A7A7A;line-height:1.5;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #E0E0E0;margin:32px 0;">
      <p style="margin:0;font-size:12px;color:#7A7A7A;">© 2026 Yarn Digital. All rights reserved.</p>
    </td></tr>
  </table>
</body></html>`,
      });

      // Log pending consent
      await adminDb.collection('consentLog').add({
        email, action: 'subscribe_requested', listId,
        source: 'api', ip, timestamp: now, status: 'pending',
      });

      return NextResponse.json({ success: true, message: 'Check your email to confirm your subscription.', requiresConfirmation: true });
    } else {
      // Single opt-in — subscribe directly
      await confirmSubscription(email, listId, now, ip, name);
      return NextResponse.json({ success: true, message: 'Successfully subscribed.' });
    }
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

/** GET — confirm double opt-in via token */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const appUrl = APP_URL;

  if (!token) {
    return NextResponse.redirect(`${appUrl}/subscribe-confirm?error=missing_token`);
  }

  const decoded = verifyConfirmToken(token);
  if (!decoded) {
    return NextResponse.redirect(`${appUrl}/subscribe-confirm?error=invalid_token`);
  }

  try {
    const now = new Date().toISOString();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await confirmSubscription(decoded.email, decoded.listId, now, ip);
    return NextResponse.redirect(`${appUrl}/subscribe-confirm?success=true&email=${encodeURIComponent(decoded.email)}`);
  } catch {
    return NextResponse.redirect(`${appUrl}/subscribe-confirm?error=server_error`);
  }
}

async function confirmSubscription(
  email: string, listId: string, now: string, ip: string, name?: string
) {
  if (!adminDb) return;

  // Find or create contact
  const contactsSnap = await adminDb.collection('contacts')
    .where('email', '==', email)
    .limit(1)
    .get();

  let contactId: string;

  if (contactsSnap.empty) {
    const nameParts = (name || '').trim().split(/\s+/);
    const newContact = await adminDb.collection('contacts').add({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email,
      type: 'lead',
      status: 'active',
      emailOptIn: true,
      emailOptInAt: now,
      createdAt: now,
      updatedAt: now,
    });
    contactId = newContact.id;
  } else {
    contactId = contactsSnap.docs[0].id;
    await contactsSnap.docs[0].ref.update({
      emailOptIn: true, emailOptInAt: now, emailOptOut: false, updatedAt: now,
    });
  }

  // Add to list member sub-collection
  await adminDb.collection('emailLists').doc(listId).collection('members').doc(contactId).set({
    contactId, email, status: 'subscribed',
    subscribedAt: now, consentIp: ip, doubleOptIn: true, updatedAt: now,
  }, { merge: true });

  // Log consent
  await adminDb.collection('consentLog').add({
    email, action: 'subscribe_confirmed', listId, contactId,
    source: 'double_opt_in', ip, timestamp: now, status: 'confirmed',
  });
}
