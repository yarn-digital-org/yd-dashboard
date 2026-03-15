/**
 * Public unsubscribe endpoint — no auth required
 * Handles one-click unsubscribe (RFC 8058) and link-based unsubscribe
 * 
 * GET  /api/public/unsubscribe?token=<token>  — renders confirmation page (redirect)
 * POST /api/public/unsubscribe                — processes unsubscribe (one-click / form)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createHmac } from 'crypto';

const UNSUB_SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || 'unsub-secret';

/**
 * Generate a verifiable unsubscribe token
 */
export function generateUnsubToken(email: string, listId: string): string {
  const payload = `${email}:${listId}`;
  const sig = createHmac('sha256', UNSUB_SECRET).update(payload).digest('hex').slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

/**
 * Verify and decode an unsubscribe token
 */
function verifyUnsubToken(token: string): { email: string; listId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) return null;

    const sig = parts.pop()!;
    const listId = parts.pop()!;
    const email = parts.join(':'); // handle emails with colons (rare but possible)
    const expectedSig = createHmac('sha256', UNSUB_SECRET).update(`${email}:${listId}`).digest('hex').slice(0, 16);

    if (sig !== expectedSig) return null;
    return { email, listId };
  } catch {
    return null;
  }
}

/** GET — redirect to unsubscribe confirmation page */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yd-dashboard.vercel.app';
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${appUrl}/unsubscribe?error=missing_token`);
  }

  return NextResponse.redirect(`${appUrl}/unsubscribe?token=${token}`);
}

/** POST — process the actual unsubscribe */
export async function POST(request: NextRequest) {
  try {
    let token: string | null = null;
    let email: string | null = null;
    let listId: string | null = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      token = body.token;
      email = body.email;
      listId = body.listId;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await request.formData();
      token = body.get('token') as string | null;
      email = body.get('email') as string | null;
      listId = body.get('listId') as string | null;
    } else {
      // RFC 8058 one-click: body is url-encoded List-Unsubscribe=One-Click
      token = new URL(request.url).searchParams.get('token');
    }

    if (!token) {
      return NextResponse.json({ error: 'Missing unsubscribe token' }, { status: 400 });
    }

    const decoded = verifyUnsubToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 400 });
    }

    email = decoded.email;
    listId = decoded.listId;

    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const now = new Date().toISOString();

    // Handle global unsubscribe (listId === 'all')
    if (listId === 'all') {
      // Find contact and mark globally unsubscribed
      const contactsSnap = await adminDb.collection('contacts')
        .where('email', '==', email)
        .limit(5)
        .get();

      const batch = adminDb.batch();
      contactsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          emailOptOut: true,
          emailOptOutAt: now,
          updatedAt: now,
        });
      });
      await batch.commit();

      // Log consent event
      await adminDb.collection('consentLog').add({
        email,
        action: 'global_unsubscribe',
        listId: 'all',
        source: 'unsubscribe_link',
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        timestamp: now,
      });

      return NextResponse.json({ success: true, message: 'You have been unsubscribed from all emails.' });
    }

    // List-specific unsubscribe — find member doc
    const contactsSnap = await adminDb.collection('contacts')
      .where('email', '==', email)
      .limit(5)
      .get();

    if (!contactsSnap.empty) {
      const contact = contactsSnap.docs[0];
      const memberRef = adminDb
        .collection('emailLists')
        .doc(listId)
        .collection('members')
        .doc(contact.id);

      await memberRef.set({
        contactId: contact.id,
        email,
        status: 'unsubscribed',
        unsubscribedAt: now,
        updatedAt: now,
      }, { merge: true });
    }

    // Log consent event
    await adminDb.collection('consentLog').add({
      email,
      action: 'unsubscribe',
      listId,
      source: 'unsubscribe_link',
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      timestamp: now,
    });

    return NextResponse.json({ success: true, message: `You have been unsubscribed from this list.` });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
