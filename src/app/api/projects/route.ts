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
  ValidationError,
  NotFoundError
} from '@/lib/api-middleware';
import { Project, ProjectStatus, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  contactId: z.string().min(1, 'Contact is required'),
  leadId: z.string().optional(),
  description: z.string().optional(),
  serviceType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  eventDate: z.string().optional(),
  location: z.string().optional(),
  quotedAmount: z.number().optional(),
  currency: z.string().default('GBP'),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived']).optional(),
  workflowId: z.string().optional(),
  workflowTasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    order: z.number(),
    isCompleted: z.boolean(),
    completedAt: z.string().optional(),
    dueDate: z.string().optional(),
    subtasks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      isCompleted: z.boolean(),
    })),
    labels: z.array(z.string()),
  })).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ============================================
// GET - List projects with filtering
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { searchParams } = new URL(request.url);

  // Query parameters
  const status = searchParams.get('status') as ProjectStatus | null;
  const contactId = searchParams.get('contactId');
  const search = searchParams.get('search')?.toLowerCase();
  const tag = searchParams.get('tag');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  // Base query - scoped to user
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.PROJECTS)
    .where('userId', '==', user.userId)
    .orderBy(sortBy, sortOrder);

  // Status filter (Firestore)
  if (status) {
    query = db
      .collection(COLLECTIONS.PROJECTS)
      .where('userId', '==', user.userId)
      .where('status', '==', status)
      .orderBy(sortBy, sortOrder);
  }

  // Contact filter (Firestore)
  if (contactId && !status) {
    query = db
      .collection(COLLECTIONS.PROJECTS)
      .where('userId', '==', user.userId)
      .where('contactId', '==', contactId)
      .orderBy(sortBy, sortOrder);
  }

  const snapshot = await query.get();
  let projects = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Project[];

  // Post-query filters (for fields not indexed together)
  if (contactId && status) {
    projects = projects.filter(p => p.contactId === contactId);
  }

  if (tag) {
    projects = projects.filter(p => p.tags?.includes(tag));
  }

  // Search filter
  if (search) {
    projects = projects.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search) ||
      p.serviceType?.toLowerCase().includes(search) ||
      p.location?.toLowerCase().includes(search)
    );
  }

  // Calculate stats before pagination
  const stats = {
    total: projects.length,
    byStatus: {
      draft: projects.filter(p => p.status === 'draft').length,
      active: projects.filter(p => p.status === 'active').length,
      on_hold: projects.filter(p => p.status === 'on_hold').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
      archived: projects.filter(p => p.status === 'archived').length,
    },
    totalQuoted: projects.reduce((sum, p) => sum + (p.quotedAmount || 0), 0),
  };

  // Pagination
  const total = projects.length;
  projects = projects.slice(offset, offset + limit);

  return successResponse({
    projects,
    stats,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + projects.length < total,
    },
  });
}

// ============================================
// POST - Create new project
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const data = await validateBody(request, createProjectSchema);

  // Verify contact exists and belongs to user
  const contactDoc = await db
    .collection(COLLECTIONS.CONTACTS)
    .doc(data.contactId)
    .get();

  if (!contactDoc.exists) {
    throw new NotFoundError('Contact not found');
  }

  const contactData = contactDoc.data();
  if (contactData?.userId !== user.userId) {
    throw new NotFoundError('Contact not found');
  }

  const now = new Date().toISOString();

  const project: Omit<Project, 'id'> = {
    userId: user.userId,
    contactId: data.contactId,
    leadId: data.leadId,
    name: data.name.trim(),
    description: data.description?.trim(),
    serviceType: data.serviceType?.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    eventDate: data.eventDate,
    location: data.location?.trim(),
    quotedAmount: data.quotedAmount,
    currency: data.currency || 'GBP',
    status: data.status || 'draft',
    workflowId: data.workflowId,
    workflowTasks: data.workflowTasks || [],
    tags: data.tags || [],
    customFields: data.customFields || {},
    invoiceIds: [],
    contractIds: [],
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.PROJECTS).add(project);

  // Update contact's projectCount
  await db.collection(COLLECTIONS.CONTACTS).doc(data.contactId).update({
    projectCount: (contactData?.projectCount || 0) + 1,
    updatedAt: now,
  });

  return successResponse(
    { id: docRef.id, ...project },
    201
  );
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
