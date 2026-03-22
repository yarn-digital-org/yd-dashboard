import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  resolveOrgId,
  successResponse,
  requireDb,
  AuthUser,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

const patchSchema = z.object({
  sector: z.string().optional(),
  channel: z.enum(['email', 'linkedin', 'instagram']).optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  tailoredServices: z.string().optional(),
});

async function getTemplate(db: FirebaseFirestore.Firestore, id: string, orgId: string) {
  const doc = await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).get();
  if (!doc.exists) throw new NotFoundError('Template not found');
  const data = doc.data()!;
  if (data.userId !== orgId) throw new ForbiddenError('Access denied');
  return { id: doc.id, ...data };
}

async function handleGet(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await context.params;
  const orgId = await resolveOrgId(context.user);
  return successResponse(await getTemplate(db, id, orgId));
}

async function handlePatch(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await context.params;
  const orgId = await resolveOrgId(context.user);
  await getTemplate(db, id, orgId);
  const body = await request.json();
  const data = patchSchema.parse(body);
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) updates[k] = v;
  }
  await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).update(updates);
  return successResponse({ id, ...updates });
}

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await context.params;
  const orgId = await resolveOrgId(context.user);
  await getTemplate(db, id, orgId);
  await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).delete();
  return successResponse({ deleted: true });
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
export const DELETE = withAuth(handleDelete);
