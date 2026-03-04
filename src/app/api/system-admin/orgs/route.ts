import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  requireDb,
  AuthUser,
  ForbiddenError,
} from '@/lib/api-middleware';
import { Organisation, COLLECTIONS } from '@/types';
import { isSystemAdmin } from '@/lib/rbac';

// GET - List all organisations (system admin only)
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const isSA = await isSystemAdmin(user.userId);
  if (!isSA) throw new ForbiddenError('System admin access required');

  const snapshot = await db
    .collection(COLLECTIONS.ORGANISATIONS)
    .orderBy('createdAt', 'desc')
    .get();

  const orgs = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const org = { id: doc.id, ...doc.data() } as Organisation;

      // Get member count
      const membersSnapshot = await db
        .collection(COLLECTIONS.ORG_MEMBERS)
        .where('orgId', '==', doc.id)
        .get();

      // Get owner info
      const ownerDoc = await db.collection(COLLECTIONS.USERS).doc(org.ownerId).get();
      const ownerData = ownerDoc.exists ? ownerDoc.data() : null;

      return {
        ...org,
        memberCount: membersSnapshot.size,
        ownerName: ownerData?.name || ownerData?.email || 'Unknown',
        ownerEmail: ownerData?.email || '',
      };
    })
  );

  return successResponse({ organisations: orgs });
}

export const GET = withAuth(handleGet);
