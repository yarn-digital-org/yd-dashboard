import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmailWithFallback } from '@/lib/email-service';

/**
 * Lead intake questionnaire automation.
 * 
 * POST /api/automations/lead-questionnaire — trigger questionnaire for a lead (manual or auto)
 * GET /api/automations/lead-questionnaire/responses — view collected responses
 */

const QUESTIONNAIRE_QUESTIONS = [
  { id: 'service', label: 'What service are you looking for?', type: 'select', options: ['New website', 'SEO & digital marketing', 'Brand identity & design', 'Shopify store', 'Paid advertising', 'Not sure yet'] },
  { id: 'timeline', label: 'What\'s your ideal timeline?', type: 'select', options: ['ASAP (within 2 weeks)', '1–2 months', '3–6 months', 'Just exploring'] },
  { id: 'budget', label: 'What\'s your budget range?', type: 'select', options: ['Under £2,000', '£2,000–£5,000', '£5,000–£10,000', '£10,000+', 'Not sure'] },
  { id: 'current_website', label: 'Do you have a current website?', type: 'select', options: ['Yes, and it\'s working well', 'Yes, but it needs work', 'No website yet'] },
  { id: 'goals', label: 'What\'s your main goal?', type: 'textarea' },
  { id: 'heard_from', label: 'How did you hear about us?', type: 'text' },
];

function generateQuestionnaireHtml(leadName: string, questionnaireUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
          YARN<span style="color: #FF3300;">.</span>
        </h1>
        <p style="margin: 0 0 32px; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">DIGITAL</p>
        
        <p style="margin: 0 0 16px; font-size: 16px; color: #0A0A0A;">Hi ${leadName.split(' ')[0]},</p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          Thanks for reaching out! We'd love to learn more about your project so we can hit the ground running when we speak.
        </p>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4A4A4A; line-height: 1.5;">
          It only takes 2 minutes — just 6 quick questions:
        </p>
        
        <a href="${questionnaireUrl}" style="display: inline-block; background-color: #FF3300; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 32px; letter-spacing: -0.01em;">
          Fill in the quick form →
        </a>
        
        <p style="margin: 0 0 8px; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          We'll review your answers before our call — no need to explain from scratch.
        </p>
        <p style="margin: 0; font-size: 14px; color: #7A7A7A; line-height: 1.5;">
          Looking forward to chatting soon.
        </p>
        <p style="margin: 16px 0 0; font-size: 15px; color: #0A0A0A; font-weight: 500;">— The Yarn Digital Team</p>
        
        <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 32px 0;">
        <p style="margin: 0; font-size: 12px; color: #7A7A7A;">© 2026 Yarn Digital · Belfast, Northern Ireland</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const jwtSecret = getJwtSecret();
    jwt.verify(token, jwtSecret);

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { leadId, contactId } = body;

    // Get lead or contact info
    let name = '';
    let email = '';

    if (leadId) {
      const leadDoc = await adminDb.collection('leads').doc(leadId).get();
      if (!leadDoc.exists) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      const lead = leadDoc.data()!;
      name = lead.name || '';
      email = lead.email || '';
    } else if (contactId) {
      const contactDoc = await adminDb.collection('contacts').doc(contactId).get();
      if (!contactDoc.exists) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      const contact = contactDoc.data()!;
      name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      email = contact.email || '';
    } else {
      return NextResponse.json({ error: 'leadId or contactId required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 });
    }

    // Create questionnaire token (valid 7 days)
    const token7d = Buffer.from(JSON.stringify({
      leadId, contactId, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })).toString('base64url');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yd-dashboard.vercel.app';
    const questionnaireUrl = `${appUrl}/questionnaire/${token7d}`;

    // Send email
    const result = await sendEmailWithFallback({
      to: email,
      subject: 'Quick question before we chat — Yarn Digital',
      html: generateQuestionnaireHtml(name, questionnaireUrl),
      replyTo: 'hello@yarndigital.co.uk',
    });

    // Record the send
    await adminDb.collection('questionnaire_sends').add({
      leadId: leadId || null,
      contactId: contactId || null,
      email,
      name,
      sentAt: new Date().toISOString(),
      questionnaireUrl,
      token: token7d,
      responded: false,
    });

    return NextResponse.json({
      success: true,
      sentTo: email,
      fallback: result.fallback || false,
      questionnaireUrl,
    });
  } catch (error) {
    console.error('Lead questionnaire error:', error);
    return NextResponse.json({ error: 'Failed to send questionnaire' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const jwtSecret = getJwtSecret();
    jwt.verify(token, jwtSecret);

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const [sendsSnap, responsesSnap] = await Promise.all([
      adminDb.collection('questionnaire_sends').orderBy('sentAt', 'desc').limit(50).get(),
      adminDb.collection('questionnaire_responses').orderBy('submittedAt', 'desc').limit(50).get(),
    ]);

    return NextResponse.json({
      sends: sendsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      responses: responsesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    });
  } catch (error) {
    console.error('Questionnaire GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch questionnaire data' }, { status: 500 });
  }
}

// Export questions for the questionnaire page
export { QUESTIONNAIRE_QUESTIONS };
