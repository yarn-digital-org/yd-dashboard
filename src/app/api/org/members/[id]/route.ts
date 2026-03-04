import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  successResponse,
  validateBody,
  requireDb,
  AuthUser,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '@/lib/api-middleware';
import { OrgMember, Role, COLLECTIONS } from '@/types';
import { getOrgMembership } from '@/lib/rbac';

const updateMemberSchema = z.object({
  roleId: z.string().optional(),
  projectIds: z.array(z.string()).optional().nullable(),
  status: z.enum(['active', 'suspended']).optional(),
});

// PUT - Update member role or project access
async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;
  if (!orgId) throw new BadRequestError('User is not part of an organisation');

  const membership = await getOrgMembership(user.userId, orgId);
  if (!membership) throw new ForbiddenError('Not a member of this organisation');
  if (membership.role.name !== 'Owner' && membership.role.name !== 'Admin') {
    throw new ForbiddenError('Only owners and admins can manage members');
  }

  const memberDoc = await db.collection(COLLECTIONS.ORG_MEMBERS).doc(id).get();
  if (!memberDoc.exists) throw new NotFoundError('Member not found');

  const member = memberDoc.data() as OrgMember;
  if (member.orgId !== orgId) throw new NotFoundError('Member not found');

  // Can't modify the org owner's membership
  const orgDoc = await db.collection(COLLECTIONS.ORGANISATIONS).doc(orgId).get();
  if (orgDoc.exists && orgDoc.data()?.ownerId === member.userId) {
    throw new ForbiddenError('Cannot modify the organisation owner');
  }

  const data = await validateBody(request, updateMemberSchema);
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {};

  if (data.roleId) {
    // Verify role exists
    const roleDoc = await db.collection(COLLECTIONS.ROLES).doc(data.roleId).get();
    if (!roleDoc.exists) throw new NotFoundError('Role not found');
    const role = roleDoc.data() as Role;
    if (role.orgId !== orgId) throw new NotFoundError('Role not found');
    if (role.isSystemRole && role.name === 'Owner') {
      throw new ForbiddenError('Cannot assign the Owner role');
    }
    updates.roleId = data.roleId;
  }

  if (data.projectIds !== undefined) {
    updates.projectIds = data.projectIds;
  }

  if (data.status) {
    updates.status = data.status;
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError('No updates provided');
  }

  await db.collection(COLLECTIONS.ORG_MEMBERS).doc(id).update(updates);

  const updated = { ...member, ...updates, id };
  return successResponse(updated);
}

// DELETE - Remove member from org
async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;
  if (!orgId) throw new BadRequestError('User is not part of an organisation');

  const membership = await getOrgMembership(user.userId, orgId);
  if (!membership) throw new ForbiddenError('Not a member of this organisation');
  if (membership.role.name !== 'Owner' && membership.role.name !== 'Admin') {
    throw new ForbiddenError('Only owners and admins can remove members');
  }

  const memberDoc = await db.collection(COLLECTIONS.ORG_MEMBERS).doc(id).get();
  if (!memberDoc.exists) throw new NotFoundError('Member not found');

  const member = memberDoc.data() as OrgMember;
  if (member.orgId !== orgId) throw new NotFoundError('Member not found');

  // Can't remove the org owner
  const orgDoc = await db.collection(COLLECTIONS.ORGANISATIONS).doc(orgId).get();
  if (orgDoc.exists && orgDoc.data()?.ownerId === member.userId) {
    throw new ForbiddenError('Cannot remove the organisation owner');
  }

  // Remove membership
  await db.collection(COLLECTIONS.ORG_MEMBERS).doc(id).delete();

  // Clear user's orgId
  await db.collection(COLLECTIONS.USERS).doc(member.userId).update({ orgId: null });

  return successResponse({ deleted: true });
}

export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
