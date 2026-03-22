import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, successResponse, requireDb, AuthUser } from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';
import { z } from 'zod';

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(await request.json());
  const now = new Date().toISOString();
  const batch = db.batch();
  let approved = 0;
  for (const id of ids) {
    const doc = await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).get();
    if (!doc.exists) continue;
    batch.update(db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id), {
      status: 'approved', approvedAt: now, updatedAt: now,
    });
    approved++;
  }
  await batch.commit();
  return successResponse({ approved });
}

export const POST = withAuth(handlePost);
