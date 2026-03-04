import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  requireDb,
  AuthUser,
  ForbiddenError,
  NotFoundError,
} from '@/lib/api-middleware';
import { Organisation, OrgMember, User, Role, COLLECTIONS } from '@/types';
import { isSystemAdmin } from '@/lib/rbac';

// GET - Get org details with members (system admin only)
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const isSA = await isSystemAdmin(user.userId);
  if (!isSA) throw new ForbiddenError('System admin access required');

  const orgDoc = await db.collection(COLLECTIONS.ORGANISATIONS).doc(id).get();
  if (!orgDoc.exists) throw new NotFoundError('Organisation not found');

  const org = { id: orgDoc.id, ...orgDoc.data() } as Organisation;

  // Get members with user + role data
  const membersSnapshot = await db
    .collection(COLLECTIONS.ORG_MEMBERS)
    .where('orgId', '==', id)
    .get();

  const members = await Promise.all(
    membersSnapshot.docs.map(async (doc) => {
      const member = { id: doc.id, ...doc.data() } as OrgMember;
      const [memberUserDoc, roleDoc] = await Promise.all([
        db.collection(COLLECTIONS.USERS).doc(member.userId).get(),
        db.collection(COLLECTIONS.ROLES).doc(member.roleId).get(),
      ]);
      const memberUser = memberUserDoc.exists ? memberUserDoc.data() as User : null;
      const role = roleDoc.exists ? roleDoc.data() as Role : null;
      return {
        ...member,
        userName: memberUser?.name || 'Unknown',
        userEmail: memberUser?.email || '',
        roleName: role?.name || 'Unknown',
      };
    })
  );

  // Get roles
  const rolesSnapshot = await db
    .collection(COLLECTIONS.ROLES)
    .where('orgId', '==', id)
    .get();
  const roles = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Get project count
  const projectsSnapshot = await db
    .collection(COLLECTIONS.PROJECTS)
    .where('userId', '==', org.ownerId)
    .get();

  return successResponse({
    organisation: org,
    members,
    roles,
    projectCount: projectsSnapshot.size,
  });
}

export const GET = withAuth(handleGet);
