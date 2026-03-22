import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  successResponse,
  validateBody,
  requireDb,
  AuthUser,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

// Org ID shared across all Yarn Digital team accounts
const YARN_ORG_ID = 'org_yarn_digital';

export type OutreachStatus =
  | 'identified' | 'pending_approval' | 'approved' | 'sent'
  | 'replied' | 'call_booked' | 'closed' | 'not_interested';

const createProspectSchema = z.object({
  company: z.string().min(1),
  sector: z.string().min(1),
  website: z.string().min(1),
  decisionMaker: z.string().min(1),
  decisionMakerTitle: z.string().optional(),
  contactMethod: z.enum(['email', 'linkedin', 'instagram', 'phone']),
  contactValue: z.string().min(1),
  painPoint: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(['identified','pending_approval','approved','sent','replied','call_booked','closed','not_interested']).optional(),
});

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const sectorFilter = searchParams.get('sector');

  // Query by org ID — all team members share this scope
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.OUTREACH_PROSPECTS)
    .where('userId', '==', YARN_ORG_ID);

  if (statusFilter) {
    query = db
      .collection(COLLECTIONS.OUTREACH_PROSPECTS)
      .where('userId', '==', YARN_ORG_ID)
      .where('status', '==', statusFilter);
  }

  const snapshot = await query.get();
  let prospects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  prospects.sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1));

  if (sectorFilter) {
    prospects = prospects.filter((p: any) => p.sector === sectorFilter);
  }

  const stats = {
    total: prospects.length,
    identified: prospects.filter((p: any) => p.status === 'identified').length,
    pending_approval: prospects.filter((p: any) => p.status === 'pending_approval').length,
    approved: prospects.filter((p: any) => p.status === 'approved').length,
    sent: prospects.filter((p: any) => p.status === 'sent').length,
    replied: prospects.filter((p: any) => p.status === 'replied').length,
    call_booked: prospects.filter((p: any) => p.status === 'call_booked').length,
    closed: prospects.filter((p: any) => p.status === 'closed').length,
    not_interested: prospects.filter((p: any) => p.status === 'not_interested').length,
  };

  return successResponse({ prospects, stats });
}

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const data = await validateBody(request, createProspectSchema);
  const now = new Date().toISOString();

  const prospect = {
    userId: YARN_ORG_ID,
    company: data.company.trim(),
    sector: data.sector,
    website: data.website.trim(),
    decisionMaker: data.decisionMaker.trim(),
    decisionMakerTitle: data.decisionMakerTitle?.trim() || null,
    contactMethod: data.contactMethod,
    contactValue: data.contactValue.trim(),
    painPoint: data.painPoint.trim(),
    notes: data.notes?.trim() || null,
    status: data.status || 'identified',
    approvedAt: null, sentAt: null, repliedAt: null,
    createdAt: now, updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).add(prospect);
  return successResponse({ id: docRef.id, ...prospect }, 201);
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
