import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  successResponse,
  validateBody,
  requireDb,
  AuthUser,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

const YARN_ORG_ID = 'org_yarn_digital';

const patchTemplateSchema = z.object({
  sector: z.string().optional(),
  channel: z.enum(['email', 'linkedin', 'instagram']).optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  tailoredServices: z.string().optional(),
});

async function getTemplate(db: FirebaseFirestore.Firestore, id: string, userId: string) {
  const doc = await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).get();
  if (!doc.exists) throw new NotFoundError('Template not found');
  const data = doc.data()!;
  if (data.userId !== userId) throw new ForbiddenError('Access denied');
  return { id: doc.id, ...data };
}

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  return successResponse(await getTemplate(db, id, YARN_ORG_ID));
}

async function handlePatch(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  await getTemplate(db, id, YARN_ORG_ID);
  const data = await validateBody(request, patchTemplateSchema);
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updatedAt: now };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) update[k] = v;
  }
  await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).update(update);
  return successResponse({ id, ...update });
}

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  await getTemplate(db, id, YARN_ORG_ID);
  await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).delete();
  return successResponse({ deleted: true });
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
export const DELETE = withAuth(handleDelete);
