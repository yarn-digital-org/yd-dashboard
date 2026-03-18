import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/automations/seed
 * Seeds default automations for the org. Idempotent — skips if already exists.
 * Protected by AGENT_API_KEY bearer token.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const agentKey = process.env.AGENT_API_KEY;
    if (!agentKey || !authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== agentKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const userId = process.env.DEFAULT_ORG_USER_ID;
    if (!userId) {
      return NextResponse.json({ error: 'DEFAULT_ORG_USER_ID not set' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const results: { name: string; status: string; id?: string }[] = [];

    // --- Automation 1: New Lead → Email Jonny ---
    const notifyName = 'Notify owner on new lead';
    const existingNotify = await adminDb.collection('automations')
      .where('userId', '==', userId)
      .where('name', '==', notifyName)
      .limit(1).get();

    if (existingNotify.empty) {
      const doc = await adminDb.collection('automations').add({
        name: notifyName,
        description: 'Sends an email to hello@yarndigital.co.uk when a new lead comes in from any landing page',
        trigger: { type: 'new_lead' },
        actions: [
          {
            type: 'send_email',
            config: {
              to: 'hello@yarndigital.co.uk',
              subject: 'New Lead: {{name}} from {{company}}',
              body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
  <h1 style="font-size:20px;font-weight:700;color:#0a0a0a;margin:0 0 24px;">New Lead Received</h1>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:120px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">{{name}}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;"><a href="mailto:{{email}}">{{email}}</a></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee;">{{phone}}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;">Company</td><td style="padding:10px 0;border-bottom:1px solid #eee;">{{company}}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;">Website</td><td style="padding:10px 0;border-bottom:1px solid #eee;">{{website}}</td></tr>
    <tr><td style="padding:10px 0;color:#666;">Message</td><td style="padding:10px 0;">{{message}}</td></tr>
  </table>
  <p style="margin:24px 0 0;"><a href="https://yd-dashboard.vercel.app/leads" style="display:inline-block;background:#e63312;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">View in Dashboard</a></p>
</div>`,
            },
          },
        ],
        enabled: true,
        userId,
        runCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ name: notifyName, status: 'created', id: doc.id });
    } else {
      results.push({ name: notifyName, status: 'already exists', id: existingNotify.docs[0].id });
    }

    // --- Automation 2: New Lead → Thank-you email to lead ---
    const ackName = 'Send lead acknowledgement email';
    const existingAck = await adminDb.collection('automations')
      .where('userId', '==', userId)
      .where('name', '==', ackName)
      .limit(1).get();

    if (existingAck.empty) {
      const doc = await adminDb.collection('automations').add({
        name: ackName,
        description: 'Sends an automatic thank-you email to the lead confirming we received their enquiry',
        trigger: { type: 'new_lead' },
        actions: [
          {
            type: 'send_email',
            config: {
              to: '{{email}}',
              subject: 'Thanks {{name}} — we\'ve received your enquiry',
              body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
  <div style="margin-bottom:32px;">
    <span style="font-size:22px;font-weight:700;color:#0a0a0a;letter-spacing:-0.02em;">YARN</span><span style="font-size:22px;font-weight:700;color:#e63312;">.</span>
    <span style="font-size:13px;color:#0a0a0a99;margin-left:4px;">Digital</span>
  </div>
  <h1 style="font-size:20px;font-weight:600;color:#0a0a0a;margin:0 0 16px;">Thanks for getting in touch, {{name}}.</h1>
  <p style="font-size:16px;color:#444;line-height:1.6;margin:0 0 16px;">We've received your enquiry and one of our team will be in touch within 1 business day.</p>
  <p style="font-size:16px;color:#444;line-height:1.6;margin:0 0 24px;">In the meantime, here's what we'll be doing: reviewing your website and preparing initial recommendations so we can hit the ground running when we speak.</p>
  <p style="font-size:14px;color:#999;margin:0;">Yarn Digital · Belfast, Northern Ireland</p>
</div>`,
            },
          },
        ],
        enabled: true,
        userId,
        runCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ name: ackName, status: 'created', id: doc.id });
    } else {
      results.push({ name: ackName, status: 'already exists', id: existingAck.docs[0].id });
    }

    return NextResponse.json({ success: true, automations: results });
  } catch (error: any) {
    console.error('Automation seed error:', error);
    return NextResponse.json({ error: error.message || 'Failed to seed automations' }, { status: 500 });
  }
}
