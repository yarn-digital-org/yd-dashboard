import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Resend webhook endpoint for inbound emails
 * Configure in Resend dashboard: POST /api/webhooks/email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Verify webhook signature if configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('svix-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      // In production, verify the signature using Resend's svix library
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Handle different event types
    switch (type) {
      case 'email.received': {
        // Inbound email received
        const { from, to, subject, html, text, message_id } = data;
        const senderEmail = typeof from === 'string' ? from : from?.email || from?.[0]?.email;
        const recipientEmail = typeof to === 'string' ? to : to?.[0]?.email || to?.[0];

        if (!senderEmail) {
          return NextResponse.json({ error: 'No sender email' }, { status: 400 });
        }

        // Find contact by email
        const contactSnapshot = await adminDb
          .collection('contacts')
          .where('email', '==', senderEmail)
          .limit(1)
          .get();

        if (contactSnapshot.empty) {
          // No matching contact - store as unmatched for review
          await adminDb.collection('unmatchedEmails').add({
            from: senderEmail,
            to: recipientEmail,
            subject: subject || '',
            body: text || html || '',
            bodyHtml: html || null,
            externalMessageId: message_id,
            receivedAt: new Date().toISOString(),
          });
          return NextResponse.json({ success: true, matched: false });
        }

        const contact = contactSnapshot.docs[0];
        const contactData = contact.data();
        const userId = contactData.userId;

        // Find or create conversation
        const convSnapshot = await adminDb
          .collection('conversations')
          .where('contactId', '==', contact.id)
          .where('userId', '==', userId)
          .limit(1)
          .get();

        let conversationId: string;
        if (convSnapshot.empty) {
          // Create new conversation
          const convRef = await adminDb.collection('conversations').add({
            contactId: contact.id,
            userId,
            lastMessageAt: new Date().toISOString(),
            lastMessagePreview: (text || subject || '').substring(0, 100),
            unreadCount: 1,
            isMuted: false,
            createdAt: new Date().toISOString(),
          });
          conversationId = convRef.id;
        } else {
          conversationId = convSnapshot.docs[0].id;
          // Increment unread count
          const currentUnread = convSnapshot.docs[0].data().unreadCount || 0;
          await adminDb.collection('conversations').doc(conversationId).update({
            lastMessageAt: new Date().toISOString(),
            lastMessagePreview: (text || subject || '').substring(0, 100),
            unreadCount: currentUnread + 1,
          });
        }

        // Store the message
        await adminDb.collection('messages').add({
          conversationId,
          userId,
          contactId: contact.id,
          direction: 'inbound',
          channel: 'email',
          subject: subject || null,
          body: text || html || '',
          bodyHtml: html || null,
          attachments: [],
          status: 'delivered',
          sentAt: new Date().toISOString(),
          readAt: null,
          externalMessageId: message_id || null,
          createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, matched: true, conversationId });
      }

      case 'email.delivered':
      case 'email.opened':
      case 'email.clicked':
      case 'email.bounced':
      case 'email.complained': {
        // Update message status based on event
        const statusMap: Record<string, string> = {
          'email.delivered': 'delivered',
          'email.opened': 'read',
          'email.bounced': 'failed',
          'email.complained': 'failed',
        };

        const newStatus = statusMap[type];
        if (newStatus && data.email_id) {
          const msgSnapshot = await adminDb
            .collection('messages')
            .where('externalMessageId', '==', data.email_id)
            .limit(1)
            .get();

          if (!msgSnapshot.empty) {
            const updates: Record<string, string> = { status: newStatus };
            if (newStatus === 'read') {
              updates.readAt = new Date().toISOString();
            }
            await adminDb.collection('messages').doc(msgSnapshot.docs[0].id).update(updates);
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: true, ignored: true });
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
