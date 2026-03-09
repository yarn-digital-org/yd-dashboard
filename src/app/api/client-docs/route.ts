import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  successResponse,
  handleApiError,
  validateBody,
  requireDb,
  AuthUser,
} from '@/lib/api-middleware';
import { ClientDoc, COLLECTIONS } from '@/types';

const contactSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().min(1),
  status: z.string().min(1),
  description: z.string(),
});

const createClientDocSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(200),
  industry: z.string().min(1, 'Industry is required').max(100),
  status: z.enum(['active', 'prospect', 'past']).optional().default('prospect'),
  overview: z.string().optional().default(''),
  contacts: z.array(contactSchema).optional().default([]),
  projects: z.array(projectSchema).optional().default([]),
  meetingNotes: z.string().optional().default(''),
});

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const search = searchParams.get('search')?.toLowerCase();

  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.CLIENT_DOCS)
    .where('orgId', '==', user.userId)
    .orderBy('clientName', 'asc');

  if (status) {
    query = db
      .collection(COLLECTIONS.CLIENT_DOCS)
      .where('orgId', '==', user.userId)
      .where('status', '==', status)
      .orderBy('clientName', 'asc');
  }

  const snapshot = await query.get();
  let clients = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ClientDoc[];

  if (search) {
    clients = clients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(search) ||
        c.industry.toLowerCase().includes(search)
    );
  }

  return successResponse({ clients, total: clients.length });
}

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const body = await validateBody(request, createClientDocSchema);

  const now = new Date().toISOString();
  const clientData = {
    ...body,
    orgId: user.userId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.CLIENT_DOCS).add(clientData);

  return successResponse(
    { id: docRef.id, ...clientData },
    201
  );
}

export const GET = withAuth(handleGet, { skipCSRF: true });
export const POST = withAuth(handlePost);
