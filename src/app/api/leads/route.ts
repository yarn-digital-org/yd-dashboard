import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { 
  withAuth, 
  successResponse, 
  handleApiError,
  validateBody,
  requireDb,
  AuthUser,
  ValidationError
} from '@/lib/api-middleware';
import { Lead, LeadStatus, LeadPriority, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  service: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.array(z.object({
    id: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  })).optional(),
});

type CreateLeadInput = z.infer<typeof createLeadSchema>;

// ============================================
// GET - List leads with filtering
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { searchParams } = new URL(request.url);

  // Query parameters
  const status = searchParams.get('status') as LeadStatus | null;
  const priority = searchParams.get('priority') as LeadPriority | null;
  const search = searchParams.get('search')?.toLowerCase();
  const tag = searchParams.get('tag');
  const source = searchParams.get('source');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  // Base query - scoped to user
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.LEADS)
    .where('userId', '==', user.userId)
    .orderBy(sortBy, sortOrder);

  // Status filter (Firestore)
  if (status) {
    query = db
      .collection(COLLECTIONS.LEADS)
      .where('userId', '==', user.userId)
      .where('status', '==', status)
      .orderBy(sortBy, sortOrder);
  }

  // Priority filter (Firestore)
  if (priority && !status) {
    query = db
      .collection(COLLECTIONS.LEADS)
      .where('userId', '==', user.userId)
      .where('priority', '==', priority)
      .orderBy(sortBy, sortOrder);
  }

  const snapshot = await query.get();
  let leads = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Lead[];

  // Post-query filters (for fields not indexed together)
  if (priority && status) {
    leads = leads.filter(l => l.priority === priority);
  }

  if (tag) {
    leads = leads.filter(l => l.tags?.includes(tag));
  }

  if (source) {
    leads = leads.filter(l => l.source === source);
  }

  // Search filter
  if (search) {
    leads = leads.filter(l =>
      l.name?.toLowerCase().includes(search) ||
      l.email?.toLowerCase().includes(search) ||
      l.company?.toLowerCase().includes(search) ||
      l.phone?.includes(search) ||
      l.service?.toLowerCase().includes(search)
    );
  }

  // Calculate stats before pagination
  const stats = {
    total: leads.length,
    byStatus: {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      proposal_sent: leads.filter(l => l.status === 'proposal_sent').length,
      won: leads.filter(l => l.status === 'won').length,
      lost: leads.filter(l => l.status === 'lost').length,
    },
    byPriority: {
      high: leads.filter(l => l.priority === 'high').length,
      medium: leads.filter(l => l.priority === 'medium').length,
      low: leads.filter(l => l.priority === 'low').length,
    },
  };

  // Pagination
  const total = leads.length;
  leads = leads.slice(offset, offset + limit);

  return successResponse({
    leads,
    stats,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + leads.length < total,
    },
  });
}

// ============================================
// POST - Create new lead
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const data = await validateBody(request, createLeadSchema);

  // Check for duplicate email (within user's leads)
  const existing = await db
    .collection(COLLECTIONS.LEADS)
    .where('userId', '==', user.userId)
    .where('email', '==', data.email.toLowerCase().trim())
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new ValidationError('A lead with this email already exists', {
      email: ['Duplicate email address'],
    });
  }

  const now = new Date().toISOString();

  const lead: Omit<Lead, 'id'> = {
    userId: user.userId,
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    phone: data.phone?.trim() || undefined,
    company: data.company?.trim() || undefined,
    service: data.service?.trim() || undefined,
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    source: data.source || 'direct',
    status: data.status || 'new',
    priority: data.priority || 'medium',
    tags: data.tags || [],
    notes: data.notes || [],
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.LEADS).add(lead);

  return successResponse(
    { id: docRef.id, ...lead },
    201
  );
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
