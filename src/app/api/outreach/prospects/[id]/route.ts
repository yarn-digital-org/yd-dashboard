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
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

const patchProspectSchema = z.object({
  action: z.enum(['approve', 'promote_to_lead']).optional(),
  company: z.string().optional(),
  sector: z.string().optional(),
  website: z.string().optional(),
  decisionMaker: z.string().optional(),
  decisionMakerTitle: z.string().optional(),
  contactMethod: z.enum(['email', 'linkedin', 'instagram', 'phone']).optional(),
  contactValue: z.string().optional(),
  painPoint: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['identified','pending_approval','approved','sent','replied','call_booked','closed','not_interested']).optional(),
  draftSubject: z.string().optional(),
  draftMessage: z.string().optional(),
});

async function getProspect(db: FirebaseFirestore.Firestore, id: string) {
  const doc = await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).get();
  if (!doc.exists) throw new NotFoundError('Prospect not found');
  return { id: doc.id, ...doc.data() };
}

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await (context.params as Promise<{ id: string }>);
  return successResponse(await getProspect(db, id));
}

async function handlePatch(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await (context.params as Promise<{ id: string }>);
  const prospect = await getProspect(db, id) as any;
  const data = await validateBody(request, patchProspectSchema);
  const now = new Date().toISOString();

  if (data.action === 'approve') {
    await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update({
      status: 'approved', approvedAt: now, updatedAt: now,
    });
    return successResponse({ id, status: 'approved', approvedAt: now });
  }

  if (data.action === 'promote_to_lead') {
    const lead = {
      userId: prospect.userId,
      name: prospect.decisionMaker || prospect.company,
      email: prospect.contactMethod === 'email' ? prospect.contactValue : '',
      phone: prospect.contactMethod === 'phone' ? prospect.contactValue : undefined,
      company: prospect.company,
      source: 'cold_outreach',
      status: 'new',
      priority: 'medium',
      tags: ['outreach', prospect.sector],
      notes: [],
      createdAt: now, updatedAt: now,
    };
    await db.collection(COLLECTIONS.LEADS).add(lead);
    await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update({
      status: 'call_booked', updatedAt: now,
    });
    return successResponse({ id, status: 'call_booked', promotedToLead: true });
  }

  // Generic field update
  const { action: _action, ...fields } = data;
  const update: Record<string, unknown> = { updatedAt: now };
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) update[k] = v;
  }
  await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).update(update);
  return successResponse({ id, ...update });
}

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { id } = await (context.params as Promise<{ id: string }>);
  await getProspect(db, id);
  await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).doc(id).delete();
  return successResponse({ deleted: true });
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch, { skipCSRF: true });
export const DELETE = withAuth(handleDelete, { skipCSRF: true });
