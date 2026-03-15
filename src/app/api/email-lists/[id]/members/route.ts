import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-middleware';
import { fetchDynamicMembersPublic } from '@/lib/email-list-resolver';

/**
 * Manage members of a static email list.
 * Dynamic lists compute members on-the-fly from contacts — no subcollection.
 */

// GET /api/email-lists/[id]/members — list members (with contact data)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const listDoc = await adminDb.collection('emailLists').doc(id).get();
    if (!listDoc.exists || listDoc.data()?.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const listData = listDoc.data()!;

    if (listData.type === 'dynamic') {
      // For dynamic lists, resolve from contacts using rules
      const contacts = await fetchDynamicMembersPublic(user.userId, listData.rules || []);
      return NextResponse.json({
        data: contacts.map((c: any) => ({
          contactId: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          type: c.type,
          tags: c.tags,
        })),
        total: contacts.length,
        type: 'dynamic',
      });
    }

    // Static: read from members subcollection
    const membersSnap = await adminDb
      .collection('emailLists').doc(id)
      .collection('members')
      .orderBy('addedAt', 'desc')
      .get();

    const memberIds = membersSnap.docs.map(d => d.id);

    // Fetch contact details (individual gets — avoids 'in' query complexity)
    const contacts: any[] = [];
    await Promise.all(
      memberIds.map(async (contactId) => {
        const doc = await adminDb!.collection('contacts').doc(contactId).get();
        if (doc.exists) contacts.push({ contactId: doc.id, ...doc.data() });
      })
    );

    return NextResponse.json({
      data: contacts.map(c => ({
        contactId: c.contactId || c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        type: c.type,
        tags: c.tags,
      })),
      total: membersSnap.size,
      type: 'static',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/email-lists/[id]/members — add contacts to static list
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const listDoc = await adminDb.collection('emailLists').doc(id).get();
    if (!listDoc.exists || listDoc.data()?.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (listDoc.data()?.type !== 'static') {
      return NextResponse.json({ error: 'Cannot manually add members to a dynamic list' }, { status: 400 });
    }

    const { contactIds } = await request.json();
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds array required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const batch = adminDb.batch();

    for (const contactId of contactIds) {
      const ref = adminDb.collection('emailLists').doc(id).collection('members').doc(contactId);
      batch.set(ref, { addedAt: now }, { merge: true });
    }

    await batch.commit();

    // Update count
    const countSnap = await adminDb.collection('emailLists').doc(id).collection('members').count().get();
    await adminDb.collection('emailLists').doc(id).update({
      memberCount: countSnap.data().count,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, added: contactIds.length, total: countSnap.data().count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/email-lists/[id]/members — remove a contact from static list
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const listDoc = await adminDb.collection('emailLists').doc(id).get();
    if (!listDoc.exists || listDoc.data()?.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { contactId } = await request.json();
    if (!contactId) {
      return NextResponse.json({ error: 'contactId required' }, { status: 400 });
    }

    await adminDb.collection('emailLists').doc(id).collection('members').doc(contactId).delete();

    const countSnap = await adminDb.collection('emailLists').doc(id).collection('members').count().get();
    await adminDb.collection('emailLists').doc(id).update({
      memberCount: countSnap.data().count,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, total: countSnap.data().count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
