import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  successResponse,
  validateBody,
  requireDb,
  AuthUser,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from '@/lib/api-middleware';
import { OrgMember, User, Role, COLLECTIONS } from '@/types';
import { getOrgMembership } from '@/lib/rbac';

const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  roleId: z.string().min(1, 'Role is required'),
  projectIds: z.array(z.string()).optional(),
});

// GET - List org members
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;

  if (!orgId) {
    return successResponse({ members: [] });
  }

  const snapshot = await db
    .collection(COLLECTIONS.ORG_MEMBERS)
    .where('orgId', '==', orgId)
    .get();

  const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrgMember[];

  // Enrich with user data and role names
  const enriched = await Promise.all(
    members.map(async (member) => {
      const [memberUserDoc, roleDoc] = await Promise.all([
        db.collection(COLLECTIONS.USERS).doc(member.userId).get(),
        db.collection(COLLECTIONS.ROLES).doc(member.roleId).get(),
      ]);
      const memberUser = memberUserDoc.exists ? memberUserDoc.data() as User : null;
      const role = roleDoc.exists ? (roleDoc.data() as Role) : null;
      return {
        ...member,
        userName: memberUser?.name || memberUser?.email || 'Unknown',
        userEmail: memberUser?.email || '',
        userAvatar: memberUser?.avatarUrl || null,
        roleName: role?.name || 'Unknown',
      };
    })
  );

  return successResponse({ members: enriched });
}

// POST - Invite a new member
async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;

  if (!orgId) {
    throw new BadRequestError('User is not part of an organisation');
  }

  // Only owner or admin can invite
  const membership = await getOrgMembership(user.userId, orgId);
  if (!membership) throw new ForbiddenError('Not a member of this organisation');
  if (membership.role.name !== 'Owner' && membership.role.name !== 'Admin') {
    throw new ForbiddenError('Only owners and admins can invite members');
  }

  const data = await validateBody(request, inviteMemberSchema);

  // Verify the role exists and belongs to this org
  const roleDoc = await db.collection(COLLECTIONS.ROLES).doc(data.roleId).get();
  if (!roleDoc.exists) throw new NotFoundError('Role not found');
  const roleData = roleDoc.data() as Role;
  if (roleData.orgId !== orgId) throw new NotFoundError('Role not found');

  // Don't allow assigning Owner role via invite
  if (roleData.isSystemRole && roleData.name === 'Owner') {
    throw new ForbiddenError('Cannot assign the Owner role to new members');
  }

  // Find the user by email
  const userSnapshot = await db
    .collection(COLLECTIONS.USERS)
    .where('email', '==', data.email)
    .limit(1)
    .get();

  if (userSnapshot.empty) {
    throw new NotFoundError('No user found with that email. They need to register first.');
  }

  const targetUser = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() } as User;

  // Check if already a member
  const existingMember = await db
    .collection(COLLECTIONS.ORG_MEMBERS)
    .where('orgId', '==', orgId)
    .where('userId', '==', targetUser.id)
    .limit(1)
    .get();

  if (!existingMember.empty) {
    throw new BadRequestError('This user is already a member of the organisation');
  }

  const now = new Date().toISOString();

  const memberData: Omit<OrgMember, 'id'> = {
    orgId,
    userId: targetUser.id,
    roleId: data.roleId,
    projectIds: data.projectIds,
    invitedBy: user.userId,
    invitedAt: now,
    joinedAt: now, // Auto-join for now (no invite flow)
    status: 'active',
  };

  const ref = await db.collection(COLLECTIONS.ORG_MEMBERS).add(memberData);

  // Update user's orgId
  await db.collection(COLLECTIONS.USERS).doc(targetUser.id).update({ orgId });

  return successResponse({ id: ref.id, ...memberData }, 201);
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
