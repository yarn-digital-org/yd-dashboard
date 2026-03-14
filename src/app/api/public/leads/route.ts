import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';

// Slack notification — zero AI tokens, pure webhook
async function notifySlack(lead: {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  message: string;
  utmSource: string;
  utmCampaign: string;
}, leadId: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_LEAD_CHANNEL;
  if (!token || !channel) return;

  const source = lead.utmCampaign
    ? `${lead.utmSource || 'direct'} / ${lead.utmCampaign}`
    : lead.utmSource || 'direct';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🚨 New Lead from Landing Page', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${lead.name}` },
        { type: 'mrkdwn', text: `*Company:*\n${lead.company}` },
        { type: 'mrkdwn', text: `*Email:*\n${lead.email}` },
        { type: 'mrkdwn', text: `*Phone:*\n${lead.phone || 'Not provided'}` },
      ],
    },
    ...(lead.website ? [{
      type: 'section' as const,
      text: { type: 'mrkdwn' as const, text: `*Website:* ${lead.website}` },
    }] : []),
    ...(lead.message ? [{
      type: 'section' as const,
      text: { type: 'mrkdwn' as const, text: `*Message:*\n${lead.message}` },
    }] : []),
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Source: ${source} · ID: ${leadId}` },
      ],
    },
  ];

  try {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text: `🚨 New lead: ${lead.name} from ${lead.company} (${lead.email})`,
        blocks,
      }),
    });
  } catch {
    // Don't let Slack errors break lead submission
    console.error('Slack notification failed (non-blocking)');
  }
}

// Rate limiting: simple in-memory store (resets on deploy)
const submissions = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max submissions per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = submissions.get(ip);
  if (!entry || now > entry.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30).optional().default(''),
  company: z.string().min(1, 'Business name is required').max(100),
  website: z.string().max(200).optional().default(''),
  message: z.string().max(1000).optional().default(''),
  source: z.string().max(100).optional().default('landing-page'),
  utmSource: z.string().max(100).optional().default(''),
  utmMedium: z.string().max(100).optional().default(''),
  utmCampaign: z.string().max(100).optional().default(''),
  utmContent: z.string().max(100).optional().default(''),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid form data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date().toISOString();

    // Create lead in Firestore — matches existing Lead schema
    const leadDoc = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      website: data.website,
      service: 'Free Website Audit',
      source: data.source,
      status: 'new',
      priority: 'high', // Landing page leads are high intent
      tags: ['landing-page', 'free-audit', ...(data.utmCampaign ? [`campaign:${data.utmCampaign}`] : [])],
      notes: data.message
        ? [{
            id: `note_${Date.now()}`,
            content: `Landing page message: ${data.message}`,
            createdAt: now,
          }]
        : [],
      utm: {
        source: data.utmSource,
        medium: data.utmMedium,
        campaign: data.utmCampaign,
        content: data.utmContent,
      },
      createdAt: now,
      updatedAt: now,
      // Assign to the org's default user — picks up in dashboard
      userId: process.env.DEFAULT_ORG_USER_ID || '',
      orgId: process.env.DEFAULT_ORG_ID || '',
    };

    const docRef = await adminDb.collection('leads').add(leadDoc);

    // Fire-and-forget Slack notification — doesn't block the response
    notifySlack(data, docRef.id).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Thank you! We\'ll be in touch within 1 business day.',
      id: docRef.id,
    });
  } catch (error) {
    console.error('Public lead submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
