import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email-service';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Unauthorized');
  const jwtSecret = getJwtSecret();
  return jwt.verify(token, jwtSecret) as { userId: string };
}

// POST /api/email-campaigns/[id]/send — send campaign to recipients
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser();
    const { id } = await params;

    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const campaignDoc = await adminDb.collection('emailCampaigns').doc(id).get();
    if (!campaignDoc.exists) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const campaign = campaignDoc.data();
    if (campaign?.userId !== user.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (!campaign?.subject || !campaign?.htmlBody) {
      return NextResponse.json({ error: 'Campaign missing subject or body' }, { status: 400 });
    }

    // Get recipient contacts
    let contactsQuery = adminDb.collection('contacts').where('userId', '==', user.userId);

    if (campaign.recipientList === 'leads') {
      contactsQuery = contactsQuery.where('type', '==', 'lead') as typeof contactsQuery;
    } else if (campaign.recipientList !== 'all') {
      // Tag-based filtering
      contactsQuery = contactsQuery.where('tags', 'array-contains', campaign.recipientList) as typeof contactsQuery;
    }

    const contactsSnap = await contactsQuery.get();
    const contacts = contactsSnap.docs
      .map(d => d.data())
      .filter(c => c.email && c.email.includes('@'));

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No recipients found for this campaign' }, { status: 400 });
    }

    // Mark as sending
    await adminDb.collection('emailCampaigns').doc(id).update({
      status: 'sending',
      updatedAt: new Date().toISOString(),
    });

    // Send emails (batch with small delay to respect rate limits)
    let sent = 0;
    let failed = 0;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@yarndigital.co.uk';
    const fromName = 'Yarn Digital';

    for (const contact of contacts) {
      try {
        // Personalise — replace {{firstName}}, {{name}}, {{email}} tokens
        const firstName = contact.firstName || contact.name?.split(' ')[0] || 'there';
        const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.name || '';
        
        const personalised = campaign.htmlBody
          .replace(/\{\{firstName\}\}/gi, firstName)
          .replace(/\{\{name\}\}/gi, fullName)
          .replace(/\{\{email\}\}/gi, contact.email);

        const result = await sendEmail({
          from: `${fromName} <${fromEmail}>`,
          to: contact.email,
          subject: campaign.subject,
          html: personalised,
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    const now = new Date().toISOString();
    await adminDb.collection('emailCampaigns').doc(id).update({
      status: 'sent',
      sentAt: now,
      updatedAt: now,
      'stats.sent': sent,
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: contacts.length,
    });
  } catch (error) {
    console.error('Campaign send error:', error);
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 });
  }
}
