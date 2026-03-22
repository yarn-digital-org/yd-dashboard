import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, successResponse, requireDb, AuthUser, NotFoundError } from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

const patchSchema = z.object({
  sector: z.string().optional(),
  channel: z.enum(['email', 'linkedin', 'instagram']).optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  tailoredServices: z.string().optional(),
});

async function getTemplate(db: FirebaseFirestore.Firestore, id: string) {
  const doc = await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).get();
  if (!doc.exists) throw new NotFoundError('Template not found');
  return { id: doc.id, ...doc.data() };
}

async function handleGet(request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) {
  const db = requireDb();
  const { id } = await context.params;
  return successResponse(await getTemplate(db, id));
}

async function handlePatch(request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) {
  const db = requireDb();
  const { id } = await context.params;
  await getTemplate(db, id);
  const data = patchSchema.parse(await request.json());
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const [k, v] of Object.entries(data)) { if (v !== undefined) updates[k] = v; }
  await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).update(updates);
  return successResponse({ id, ...updates });
}

async function handleDelete(request: NextRequest, context: { params: Promise<Record<string, string>>; user: AuthUser }) {
  const db = requireDb();
  const { id } = await context.params;
  await getTemplate(db, id);
  await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).doc(id).delete();
  return successResponse({ deleted: true });
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
export const DELETE = withAuth(handleDelete);
