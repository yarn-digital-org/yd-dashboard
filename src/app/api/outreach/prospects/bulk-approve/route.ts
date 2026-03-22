import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  successResponse,
  validateBody,
  requireDb,
  AuthUser,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

const bulkApproveSchema = z.object({
  ids: z.array(z.string()).min(1),
});

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { ids } = await validateBody(request, bulkApproveSchema);
  const now = new Date().toISOString();

  const batch = db.batch();
  for (const id of ids) {
    const ref = db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id);
    // Verify ownership by checking the doc exists and belongs to user
    const doc = await ref.get();
    if (doc.exists && doc.data()?.userId === user.userId) {
      batch.update(ref, { status: 'approved', approvedAt: now, updatedAt: now });
    }
  }
  await batch.commit();

  return successResponse({ approved: ids.length });
}

export const POST = withAuth(handlePost);
