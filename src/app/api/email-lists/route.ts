import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-middleware';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Email Lists & Segments
 *
 * Two types:
 *  - static:  manually managed member list (add/remove contacts by ID)
 *  - dynamic: rule-based — automatically includes contacts matching criteria
 *             Rules: { field, operator, value } e.g. type = 'lead', tags includes 'vip'
 *
 * Stored in Firestore: emailLists/{listId}
 * Static members: emailLists/{listId}/members/{contactId}
 */

export type ListType = 'static' | 'dynamic';

export interface SegmentRule {
  field: 'type' | 'tags' | 'company' | 'city' | 'country' | 'leadId';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value?: string;
}

export interface EmailList {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  type: ListType;
  rules?: SegmentRule[]; // only for dynamic lists
  tags?: string[];       // tags to sync to/from contacts
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

async function resolveListCount(userId: string, list: EmailList & { id: string }): Promise<number> {
  if (!adminDb) return 0;
  if (list.type === 'static') {
    const snap = await adminDb
      .collection('emailLists').doc(list.id)
      .collection('members').count().get();
    return snap.data().count;
  }
  // Dynamic: count matching contacts
  return countDynamicMembers(userId, list.rules || []);
}

async function countDynamicMembers(userId: string, rules: SegmentRule[]): Promise<number> {
  if (!adminDb) return 0;
  const contacts = await fetchDynamicMembers(userId, rules, true);
  return contacts.length;
}

async function fetchDynamicMembers(userId: string, rules: SegmentRule[], countOnly = false): Promise<any[]> {
  if (!adminDb) return [];
  let query: FirebaseFirestore.Query = adminDb.collection('contacts').where('userId', '==', userId);

  // Apply Firestore-compatible rules (simple equality rules)
  for (const rule of rules) {
    if (rule.operator === 'equals' && rule.field !== 'tags') {
      query = query.where(rule.field, '==', rule.value);
    }
    if (rule.operator === 'contains' && rule.field === 'tags' && rule.value) {
      query = query.where('tags', 'array-contains', rule.value);
    }
  }

  const snap = await query.limit(countOnly ? 500 : 1000).get();
  let docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  // Client-side filtering for operators Firestore can't handle
  for (const rule of rules) {
    if (rule.operator === 'not_equals') {
      docs = docs.filter(c => c[rule.field] !== rule.value);
    } else if (rule.operator === 'not_contains' && rule.field === 'tags') {
      docs = docs.filter(c => !((c.tags || []).includes(rule.value)));
    } else if (rule.operator === 'exists') {
      docs = docs.filter(c => !!c[rule.field]);
    } else if (rule.operator === 'not_exists') {
      docs = docs.filter(c => !c[rule.field]);
    }
  }

  return docs;
}

// GET /api/email-lists
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const snap = await adminDb.collection('emailLists')
      .where('userId', '==', user.userId)
      .orderBy('createdAt', 'desc')
      .get();

    const lists = snap.docs.map(d => ({ id: d.id, ...d.data() })) as (EmailList & { id: string })[];

    // Enrich with live counts
    const enriched = await Promise.all(
      lists.map(async (list) => ({
        ...list,
        memberCount: await resolveListCount(user.userId, list),
      }))
    );

    return NextResponse.json({ data: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/email-lists — create list
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const body = await request.json();
    const { name, description, type, rules, tags } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 });
    }
    if (!['static', 'dynamic'].includes(type)) {
      return NextResponse.json({ error: 'type must be static or dynamic' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const list: EmailList = {
      userId: user.userId,
      name,
      description: description || '',
      type,
      rules: type === 'dynamic' ? (rules || []) : undefined,
      tags: tags || [],
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb.collection('emailLists').add(list);
    const id = ref.id;

    // For dynamic lists, compute initial count
    const memberCount = type === 'dynamic'
      ? await countDynamicMembers(user.userId, rules || [])
      : 0;

    await ref.update({ memberCount });

    return NextResponse.json({ data: { id, ...list, memberCount } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create list' }, { status: 500 });
  }
}
