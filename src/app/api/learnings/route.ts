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
  resolveOrgId
} from '@/lib/api-middleware';
import { Learning, LearningCategory, LearningImpact, LearningStatus, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const createLearningSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  category: z.enum(['seo', 'development', 'design', 'marketing', 'client-management']),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional().default([]),
  client: z.string().optional(),
  project: z.string().optional(),
  impact: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  actionable: z.boolean().optional().default(true),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
});

const querySchema = z.object({
  category: z.enum(['seo', 'development', 'design', 'marketing', 'client-management']).optional(),
  tags: z.string().optional(), // comma-separated tags
  client: z.string().optional(),
  impact: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

// ============================================
// GET /api/learnings - List learnings with filtering
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  
  const { searchParams } = new URL(request.url);
  const params = querySchema.parse(Object.fromEntries(searchParams.entries()));
  
  const orgId = await resolveOrgId(user);
  
  let query = db.collection(COLLECTIONS.LEARNINGS)
    .where('orgId', '==', orgId);

    // Apply filters
    if (params.category) {
      query = query.where('category', '==', params.category);
    }
    
    if (params.client) {
      query = query.where('client', '==', params.client);
    }
    
    if (params.impact) {
      query = query.where('impact', '==', params.impact);
    }
    
    if (params.status) {
      query = query.where('status', '==', params.status);
    }

    // Order and paginate
    query = query
      .orderBy('dateCreated', 'desc')
      .limit(params.limit)
      .offset(params.offset);

    const snapshot = await query.get();
    
    let learnings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings
      dateCreated: doc.data().dateCreated?.toDate?.()?.toISOString() || doc.data().dateCreated,
      lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || doc.data().lastUpdated,
    })) as Learning[];

    // Client-side filtering for tags if multiple provided
    if (params.tags) {
      const tagArray = params.tags.split(',').map(tag => tag.trim());
      if (tagArray.length > 1) {
        // Multiple tags - filter for learnings that have ALL specified tags
        learnings = learnings.filter(learning => 
          tagArray.every(tag => learning.tags?.includes(tag))
        );
      }
      // Single tag filtering is handled by Firestore array-contains query below
    }

    // Apply single tag filter via Firestore if only one tag
    if (params.tags && !params.tags.includes(',')) {
      query = query.where('tags', 'array-contains', params.tags);
    }

  return successResponse({
    learnings,
    total: learnings.length,
    hasMore: learnings.length === params.limit,
    pagination: {
      limit: params.limit,
      offset: params.offset,
    }
  });
}

// ============================================
// POST /api/learnings - Create a new learning
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  
  const body = await validateBody(request, createLearningSchema);
  const orgId = await resolveOrgId(user);
  
  const now = new Date();
  const learningData: Omit<Learning, 'id'> = {
    title: body.title,
    description: body.description,
    category: body.category,
    tags: body.tags || [],
    client: body.client || undefined,
    project: body.project || undefined,
    impact: body.impact || 'medium',
    actionable: body.actionable !== false, // Default to true
    dateCreated: now.toISOString(),
    lastUpdated: now.toISOString(),
    createdBy: user.userId,
    updatedBy: user.userId,
    status: body.status || 'published',
    orgId: orgId,
  };

  // Add the learning to Firestore
  const docRef = await db.collection(COLLECTIONS.LEARNINGS).add({
    ...learningData,
    dateCreated: now, // Store as Firestore timestamp
    lastUpdated: now,
  });
    
    const newLearning: Learning = {
      id: docRef.id,
      ...learningData,
    };

  return successResponse({
    learning: newLearning,
    id: docRef.id,
  }, 201);
}

// Export handlers with auth middleware
export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);