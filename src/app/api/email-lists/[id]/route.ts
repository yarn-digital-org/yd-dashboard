import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-middleware';
import { SegmentRule } from '../route';

// GET /api/email-lists/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const doc = await adminDb.collection('emailLists').doc(id).get();
    if (!doc.exists || doc.data()?.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { id: doc.id, ...doc.data() } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

// PATCH /api/email-lists/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const doc = await adminDb.collection('emailLists').doc(id).get();
    if (!doc.exists || doc.data()?.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowed = ['name', 'description', 'rules', 'tags'];
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    await adminDb.collection('emailLists').doc(id).update(updates);
    return NextResponse.json({ data: { id, ...doc.data(), ...updates } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/email-lists/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const doc = await adminDb.collection('emailLists').doc(id).get();
    if (!doc.exists || doc.data()?.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete members subcollection in batches
    const members = await adminDb.collection('emailLists').doc(id).collection('members').get();
    const batch = adminDb.batch();
    members.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();

    await adminDb.collection('emailLists').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
