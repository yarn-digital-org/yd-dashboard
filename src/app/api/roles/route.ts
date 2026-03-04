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
} from '@/lib/api-middleware';
import { Role, PermissionLevel, PermissionModule, COLLECTIONS } from '@/types';
import { getOrgMembership } from '@/lib/rbac';

const VALID_MODULES: PermissionModule[] = [
  'projects', 'invoices', 'contacts', 'contracts', 'messages',
  'workflows', 'calendar', 'leads', 'forms', 'content', 'automations',
];

const VALID_LEVELS: PermissionLevel[] = ['none', 'view', 'edit', 'manage'];

const permissionsSchema = z.record(
  z.enum(VALID_MODULES as [string, ...string[]]),
  z.enum(VALID_LEVELS as [string, ...string[]])
);

const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  permissions: permissionsSchema,
});

// GET - List roles for user's org
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  // Get user's org
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const userData = userDoc.data();
  const orgId = userData?.orgId;

  if (!orgId) {
    return successResponse({ roles: [] });
  }

  const snapshot = await db
    .collection(COLLECTIONS.ROLES)
    .where('orgId', '==', orgId)
    .orderBy('createdAt', 'asc')
    .get();

  const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Role[];

  return successResponse({ roles });
}

// POST - Create a new role
async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const userData = userDoc.data();
  const orgId = userData?.orgId;

  if (!orgId) {
    throw new BadRequestError('User is not part of an organisation');
  }

  // Check user has permission (must be owner or admin)
  const membership = await getOrgMembership(user.userId, orgId);
  if (!membership) {
    throw new ForbiddenError('Not a member of this organisation');
  }
  
  const roleName = membership.role.name;
  if (roleName !== 'Owner' && roleName !== 'Admin') {
    throw new ForbiddenError('Only owners and admins can create roles');
  }

  const data = await validateBody(request, createRoleSchema);

  // Check for duplicate name
  const existing = await db
    .collection(COLLECTIONS.ROLES)
    .where('orgId', '==', orgId)
    .where('name', '==', data.name)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new BadRequestError('A role with this name already exists');
  }

  const now = new Date().toISOString();

  // Fill in any missing modules with 'none'
  const permissions: Record<PermissionModule, PermissionLevel> = {} as Record<PermissionModule, PermissionLevel>;
  for (const mod of VALID_MODULES) {
    permissions[mod] = (data.permissions as Record<string, PermissionLevel>)[mod] || 'none';
  }

  const roleData: Omit<Role, 'id'> = {
    orgId,
    name: data.name.trim(),
    description: data.description?.trim(),
    permissions,
    isPreset: false,
    isSystemRole: false,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTIONS.ROLES).add(roleData);

  return successResponse({ id: ref.id, ...roleData }, 201);
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
