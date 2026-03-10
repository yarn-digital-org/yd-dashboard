import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { 
  withAuth, 
  successResponse, 
  validateBody,
  requireDb,
  AuthUser,
  resolveOrgId,
  NotFoundError
} from '@/lib/api-middleware';
import { Learning, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const updateLearningSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters').optional(),
  category: z.enum(['seo', 'development', 'design', 'marketing', 'client-management']).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  client: z.string().optional(),
  project: z.string().optional(),
  impact: z.enum(['high', 'medium', 'low']).optional(),
  actionable: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// ============================================
// GET /api/learnings/[id] - Get specific learning
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  
  const orgId = await resolveOrgId(user);

  const docRef = db.collection(COLLECTIONS.LEARNINGS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Learning not found');
  }

  const data = doc.data();
  
  // Check if learning belongs to user's organization
  if (data?.orgId !== orgId) {
    throw new NotFoundError('Learning not found');
  }

  const learning: Learning = {
    id: doc.id,
    ...data,
    // Convert Firestore timestamps to ISO strings
    dateCreated: data?.dateCreated?.toDate?.()?.toISOString() || data?.dateCreated,
    lastUpdated: data?.lastUpdated?.toDate?.()?.toISOString() || data?.lastUpdated,
  } as Learning;

  return successResponse({ learning });
}

// ============================================
// PUT /api/learnings/[id] - Update specific learning
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  
  const orgId = await resolveOrgId(user);
  const body = await validateBody(request, updateLearningSchema);

  const docRef = db.collection(COLLECTIONS.LEARNINGS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Learning not found');
  }

  const existingData = doc.data();
  
  // Check if learning belongs to user's organization
  if (existingData?.orgId !== orgId) {
    throw new NotFoundError('Learning not found');
  }

  // Prepare update data
  const updateData: any = {
    ...body,
    lastUpdated: new Date(),
    updatedBy: user.userId,
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  // Update the document
  await docRef.update(updateData);

  // Get the updated document
  const updatedDoc = await docRef.get();
  const updatedData = updatedDoc.data();
  
  const learning: Learning = {
    id: updatedDoc.id,
    ...updatedData,
    // Convert Firestore timestamps to ISO strings
    dateCreated: updatedData?.dateCreated?.toDate?.()?.toISOString() || updatedData?.dateCreated,
    lastUpdated: updatedData?.lastUpdated?.toDate?.()?.toISOString() || updatedData?.lastUpdated,
  } as Learning;

  return successResponse({ learning });
}

// ============================================
// DELETE /api/learnings/[id] - Archive learning (soft delete)
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  
  const orgId = await resolveOrgId(user);

  const docRef = db.collection(COLLECTIONS.LEARNINGS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Learning not found');
  }

  const existingData = doc.data();
  
  // Check if learning belongs to user's organization
  if (existingData?.orgId !== orgId) {
    throw new NotFoundError('Learning not found');
  }

  // Soft delete: set status to archived instead of actually deleting
  await docRef.update({
    status: 'archived',
    lastUpdated: new Date(),
    updatedBy: user.userId,
  });

  return successResponse({ 
    message: 'Learning archived successfully',
    id: id 
  });
}

// Export handlers with auth middleware
export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);