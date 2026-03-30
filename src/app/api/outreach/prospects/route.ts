import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  successResponse,
  validateBody,
  resolveOrgId,
  requireDb,
  AuthUser,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';


export type OutreachStatus =
  | 'identified'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'replied'
  | 'call_booked'
  | 'closed'
  | 'not_interested'
  | 'rejected';

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
  status: z.enum(['identified','pending_approval','approved','sent','replied','call_booked','closed','not_interested','rejected']).optional(),
});

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const orgId = await resolveOrgId(context.user);
  const { user } = context;
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const sectorFilter = searchParams.get('sector');

  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.OUTREACH_PROSPECTS)
    .where('userId', '==', orgId);

  if (statusFilter) {
    query = db
      .collection(COLLECTIONS.OUTREACH_PROSPECTS)
      .where('userId', '==', orgId)
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
  const orgId = await resolveOrgId(context.user);
  const { user } = context;
  const data = await validateBody(request, createProspectSchema);
  const now = new Date().toISOString();

  // Decode any HTML entities that may have been introduced by the caller
  const decodeEntities = (str: string) =>
    str
      .replace(/&#x2F;/g, '/')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");

  const companyClean = decodeEntities(data.company.trim());
  const websiteClean = decodeEntities(data.website.trim());

  // --- Dedup guard: check for existing prospect by company name or website ---
  const normalizeForDedup = (s: string) =>
    s.toLowerCase().replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '').replace(/[^\w\s@.]/g, '').trim();

  const companyNorm = normalizeForDedup(companyClean);
  const websiteNorm = normalizeForDedup(websiteClean);

  // Query existing prospects for this org
  const existingSnap = await db
    .collection(COLLECTIONS.OUTREACH_PROSPECTS)
    .where('userId', '==', orgId)
    .get();

  const duplicate = existingSnap.docs.find(doc => {
    const d = doc.data();
    const existingCompany = normalizeForDedup(d.company || d.businessName || '');
    const existingWebsite = normalizeForDedup(d.website || d.url || '');
    // Match on company name OR website (either is enough to flag a dupe)
    if (companyNorm && existingCompany && companyNorm === existingCompany) return true;
    if (websiteNorm && existingWebsite && websiteNorm === existingWebsite) return true;
    return false;
  });

  if (duplicate) {
    return successResponse(
      {
        id: duplicate.id,
        ...duplicate.data(),
        _deduplicated: true,
        _message: `Existing prospect matched by company/website — skipped insert`,
      } as any,
      200
    );
  }
  // --- End dedup guard ---

  const prospect = {
    userId: orgId,
    company: companyClean,
    sector: data.sector,
    website: websiteClean,
    decisionMaker: decodeEntities(data.decisionMaker.trim()),
    decisionMakerTitle: data.decisionMakerTitle ? decodeEntities(data.decisionMakerTitle.trim()) : null,
    contactMethod: data.contactMethod,
    contactValue: decodeEntities(data.contactValue.trim()),
    painPoint: decodeEntities(data.painPoint.trim()),
    notes: data.notes ? decodeEntities(data.notes.trim()) : null,
    status: data.status || 'identified',
    approvedAt: null,
    sentAt: null,
    repliedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.OUTREACH_PROSPECTS).add(prospect);
  return successResponse({ id: docRef.id, ...prospect }, 201);
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost, { skipCSRF: true });
