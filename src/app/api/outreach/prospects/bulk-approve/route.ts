import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  resolveOrgId,
  successResponse,
  requireDb,
  AuthUser,
  ForbiddenError,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';
import { z } from 'zod';

const bulkApproveSchema = z.object({
  ids: z.array(z.string()).min(1),
});

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const orgId = await resolveOrgId(context.user);
  const body = await request.json();
  const { ids } = bulkApproveSchema.parse(body);
  const now = new Date().toISOString();

  const batch = db.batch();
  let approved = 0;

  for (const id of ids) {
    const doc = await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).get();
    if (!doc.exists) continue;
    if (doc.data()!.userId !== orgId) throw new ForbiddenError('Access denied');
    batch.update(db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id), {
      status: 'approved', approvedAt: now, updatedAt: now,
    });
    approved++;
  }

  await batch.commit();
  return successResponse({ approved });
}

export const POST = withAuth(handlePost);
