import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export interface EmailCampaign {
  id?: string;
  userId: string;
  name: string;
  subject: string;
  previewText?: string;
  htmlBody: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  recipientList: 'all' | 'leads' | 'contacts' | string; // tag filter or 'all'
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: string;
  updatedAt: string;
}

async function getUser(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Unauthorized');
  const jwtSecret = getJwtSecret();
  return jwt.verify(token, jwtSecret) as { userId: string };
}

// GET /api/email-campaigns — list campaigns
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const snapshot = await adminDb.collection('emailCampaigns')
      .where('userId', '==', user.userId)
      .orderBy('createdAt', 'desc')
      .get();

    const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ data: campaigns });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/email-campaigns — create campaign
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const body = await request.json();
    const now = new Date().toISOString();

    const campaign: Omit<EmailCampaign, 'id'> = {
      userId: user.userId,
      name: body.name || 'Untitled Campaign',
      subject: body.subject || '',
      previewText: body.previewText || '',
      htmlBody: body.htmlBody || '',
      status: 'draft',
      recipientList: body.recipientList || 'all',
      scheduledAt: body.scheduledAt || undefined,
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb.collection('emailCampaigns').add(campaign);
    return NextResponse.json({ data: { id: ref.id, ...campaign } }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
