import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Unauthorized');
  const jwtSecret = getJwtSecret();
  return jwt.verify(token, jwtSecret) as { userId: string };
}

async function getCampaign(id: string, userId: string) {
  if (!adminDb) throw new Error('DB not configured');
  const doc = await adminDb.collection('emailCampaigns').doc(id).get();
  if (!doc.exists) throw new Error('Not found');
  const data = doc.data();
  if (data?.userId !== userId) throw new Error('Unauthorized');
  return { id: doc.id, ...data };
}

// GET /api/email-campaigns/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser();
    const { id } = await params;
    const campaign = await getCampaign(id, user.userId);
    return NextResponse.json({ data: campaign });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: msg === 'Not found' ? 404 : 401 });
  }
}

// PATCH /api/email-campaigns/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser();
    const { id } = await params;
    await getCampaign(id, user.userId); // ownership check

    const body = await request.json();
    const allowed = ['name', 'subject', 'previewText', 'htmlBody', 'recipientList', 'scheduledAt', 'status'];
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    await adminDb.collection('emailCampaigns').doc(id).update(updates);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/email-campaigns/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser();
    const { id } = await params;
    await getCampaign(id, user.userId);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    await adminDb.collection('emailCampaigns').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
