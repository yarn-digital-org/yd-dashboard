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
import { Role, PermissionLevel, PermissionModule, COLLECTIONS } from '@/types';
import { getOrgMembership } from '@/lib/rbac';

const VALID_MODULES: PermissionModule[] = [
  'projects', 'invoices', 'contacts', 'contracts', 'messages',
  'workflows', 'calendar', 'leads', 'forms', 'content', 'automations',
];
const VALID_LEVELS: PermissionLevel[] = ['none', 'view', 'edit', 'manage'];

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  permissions: z.record(
    z.enum(VALID_MODULES as [string, ...string[]]),
    z.enum(VALID_LEVELS as [string, ...string[]])
  ).optional(),
});

async function requireOwnerOrAdmin(userId: string, orgId: string) {
  const membership = await getOrgMembership(userId, orgId);
  if (!membership) throw new ForbiddenError('Not a member of this organisation');
  if (membership.role.name !== 'Owner' && membership.role.name !== 'Admin') {
    throw new ForbiddenError('Only owners and admins can manage roles');
  }
  return membership;
}

// GET - Get single role
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await context.params;

  const doc = await db.collection(COLLECTIONS.ROLES).doc(id).get();
  if (!doc.exists) throw new NotFoundError('Role not found');

  return successResponse({ id: doc.id, ...doc.data() });
}

// PUT - Update role
async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const roleDoc = await db.collection(COLLECTIONS.ROLES).doc(id).get();
  if (!roleDoc.exists) throw new NotFoundError('Role not found');

  const role = roleDoc.data() as Role;

  if (role.isSystemRole) {
    throw new ForbiddenError('Cannot modify the Owner role');
  }

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;
  if (!orgId || role.orgId !== orgId) throw new NotFoundError('Role not found');

  await requireOwnerOrAdmin(user.userId, orgId);

  const data = await validateBody(request, updateRoleSchema);
  const now = new Date().toISOString();

  // Check name uniqueness if changing
  if (data.name && data.name !== role.name) {
    const existing = await db
      .collection(COLLECTIONS.ROLES)
      .where('orgId', '==', orgId)
      .where('name', '==', data.name)
      .limit(1)
      .get();
    if (!existing.empty) throw new BadRequestError('A role with this name already exists');
  }

  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.name) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.permissions) {
    const permissions: Record<PermissionModule, PermissionLevel> = { ...role.permissions } as Record<PermissionModule, PermissionLevel>;
    for (const [mod, level] of Object.entries(data.permissions)) {
      permissions[mod as PermissionModule] = level as PermissionLevel;
    }
    updates.permissions = permissions;
  }

  await db.collection(COLLECTIONS.ROLES).doc(id).update(updates);

  return successResponse({ id, ...role, ...updates });
}

// DELETE - Delete role
async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const roleDoc = await db.collection(COLLECTIONS.ROLES).doc(id).get();
  if (!roleDoc.exists) throw new NotFoundError('Role not found');

  const role = roleDoc.data() as Role;

  if (role.isSystemRole) {
    throw new ForbiddenError('Cannot delete the Owner role');
  }

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;
  if (!orgId || role.orgId !== orgId) throw new NotFoundError('Role not found');

  await requireOwnerOrAdmin(user.userId, orgId);

  // Check if any members use this role
  const membersWithRole = await db
    .collection(COLLECTIONS.ORG_MEMBERS)
    .where('roleId', '==', id)
    .limit(1)
    .get();

  if (!membersWithRole.empty) {
    throw new BadRequestError('Cannot delete a role that is assigned to members. Reassign them first.');
  }

  await db.collection(COLLECTIONS.ROLES).doc(id).delete();

  return successResponse({ deleted: true });
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
