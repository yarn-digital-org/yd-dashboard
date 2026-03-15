/**
 * Resolve dynamic email list members from contacts collection.
 * Shared between API routes to avoid circular imports.
 */
import { adminDb } from '@/lib/firebase-admin';
import type { SegmentRule } from '@/app/api/email-lists/route';

export async function fetchDynamicMembersPublic(userId: string, rules: SegmentRule[]): Promise<any[]> {
  if (!adminDb) return [];
  let query: FirebaseFirestore.Query = adminDb.collection('contacts').where('userId', '==', userId);

  // Apply Firestore-pushdown rules
  for (const rule of rules) {
    if (rule.operator === 'equals' && rule.field !== 'tags' && rule.value !== undefined) {
      query = query.where(rule.field, '==', rule.value);
    }
    if (rule.operator === 'contains' && rule.field === 'tags' && rule.value) {
      query = query.where('tags', 'array-contains', rule.value);
    }
  }

  const snap = await query.limit(1000).get();
  let docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  // Client-side filtering for remaining operators
  for (const rule of rules) {
    switch (rule.operator) {
      case 'not_equals':
        docs = docs.filter(c => c[rule.field] !== rule.value);
        break;
      case 'not_contains':
        if (rule.field === 'tags') {
          docs = docs.filter(c => !(c.tags || []).includes(rule.value));
        }
        break;
      case 'exists':
        docs = docs.filter(c => !!c[rule.field]);
        break;
      case 'not_exists':
        docs = docs.filter(c => !c[rule.field]);
        break;
    }
  }

  return docs;
}
