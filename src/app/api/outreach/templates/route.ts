import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  resolveOrgId,
  successResponse,
  validateBody,
  requireDb,
  AuthUser,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

const createTemplateSchema = z.object({
  sector: z.string().min(1),
  channel: z.enum(['email', 'linkedin', 'instagram']),
  subject: z.string().min(1),
  body: z.string().min(1),
  tailoredServices: z.string().optional(),
});

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const orgId = await resolveOrgId(context.user);
  const snapshot = await db
    .collection(COLLECTIONS.OUTREACH_TEMPLATES)
    .where('userId', '==', orgId)
    .get();
  const templates = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1));
  return successResponse({ templates });
}

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const orgId = await resolveOrgId(context.user);
  const data = await validateBody(request, createTemplateSchema);
  const now = new Date().toISOString();

  const template = {
    userId: orgId,
    sector: data.sector,
    channel: data.channel,
    subject: data.subject.trim(),
    body: data.body.trim(),
    tailoredServices: data.tailoredServices?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.OUTREACH_TEMPLATES).add(template);
  return successResponse({ id: docRef.id, ...template }, 201);
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
