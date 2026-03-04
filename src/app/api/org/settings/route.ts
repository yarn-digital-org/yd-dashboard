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
import { Organisation, COLLECTIONS } from '@/types';
import { getOrgMembership, createDefaultRoles, getOwnerRoleId } from '@/lib/rbac';

const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
  projectSharingMode: z.enum(['all', 'per_project']).optional(),
});

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organisation name is required').max(100),
});

// GET - Get org settings
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;

  if (!orgId) {
    return successResponse({ organisation: null });
  }

  const orgDoc = await db.collection(COLLECTIONS.ORGANISATIONS).doc(orgId).get();
  if (!orgDoc.exists) {
    return successResponse({ organisation: null });
  }

  return successResponse({
    organisation: { id: orgDoc.id, ...orgDoc.data() } as Organisation,
  });
}

// POST - Create organisation (if user doesn't have one)
async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  if (userDoc.data()?.orgId) {
    throw new BadRequestError('User already belongs to an organisation');
  }

  const data = await validateBody(request, createOrgSchema);
  const now = new Date().toISOString();

  const orgData: Omit<Organisation, 'id'> = {
    name: data.name.trim(),
    ownerId: user.userId,
    projectSharingMode: 'all',
    createdAt: now,
    updatedAt: now,
  };

  const orgRef = await db.collection(COLLECTIONS.ORGANISATIONS).add(orgData);
  const orgId = orgRef.id;

  // Create default roles
  const roleIds = await createDefaultRoles(orgId);

  // Get the Owner role ID
  const ownerRoleId = await getOwnerRoleId(orgId);

  // Create the owner's membership
  const memberData = {
    orgId,
    userId: user.userId,
    roleId: ownerRoleId,
    invitedBy: user.userId,
    invitedAt: now,
    joinedAt: now,
    status: 'active',
  };
  await db.collection(COLLECTIONS.ORG_MEMBERS).add(memberData);

  // Update user's orgId
  await db.collection(COLLECTIONS.USERS).doc(user.userId).update({ orgId });

  return successResponse({ id: orgId, ...orgData, roleIds }, 201);
}

// PUT - Update org settings (owner only)
async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.userId).get();
  const orgId = userDoc.data()?.orgId;

  if (!orgId) throw new BadRequestError('User is not part of an organisation');

  const orgDoc = await db.collection(COLLECTIONS.ORGANISATIONS).doc(orgId).get();
  if (!orgDoc.exists) throw new NotFoundError('Organisation not found');

  const org = orgDoc.data() as Organisation;

  // Only the owner can change org settings
  if (org.ownerId !== user.userId) {
    throw new ForbiddenError('Only the organisation owner can update settings');
  }

  const data = await validateBody(request, updateOrgSchema);
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.name) updates.name = data.name.trim();
  if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
  if (data.projectSharingMode) updates.projectSharingMode = data.projectSharingMode;

  await db.collection(COLLECTIONS.ORGANISATIONS).doc(orgId).update(updates);

  const updated = { ...org, ...updates, id: orgId };
  return successResponse(updated);
}

export const GET = withAuth(handleGet as Parameters<typeof withAuth>[0]);
export const POST = withAuth(handlePost as Parameters<typeof withAuth>[0]);
export const PUT = withAuth(handlePut as Parameters<typeof withAuth>[0]);
