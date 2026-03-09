import { adminDb } from './firebase-admin';
import { AuthUser } from './api-middleware';
import { COLLECTIONS } from '@/types';

/**
 * Resolve the orgId for a user.
 * If the user belongs to an org, return that orgId.
 * Otherwise fall back to user.userId (backwards compat).
 */
export async function resolveOrgId(user: AuthUser): Promise<string> {
  if (!adminDb) return user.userId;

  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;

  return orgId || user.userId;
}
