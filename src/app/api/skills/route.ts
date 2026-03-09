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
import { Skill, COLLECTIONS } from '@/types';

const createSkillSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.enum(['Content', 'SEO', 'Development', 'Marketing', 'Design', 'Analytics', 'Operations']),
  content: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  agentIds: z.array(z.string()).optional().default([]),
  source: z.enum(['internal', 'imported']).optional().default('internal'),
});

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase();

  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.SKILLS)
    .where('orgId', '==', user.userId)
    .orderBy('name', 'asc');

  if (category) {
    query = db
      .collection(COLLECTIONS.SKILLS)
      .where('orgId', '==', user.userId)
      .where('category', '==', category)
      .orderBy('name', 'asc');
  }

  const snapshot = await query.get();
  let skills = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Skill[];

  if (search) {
    skills = skills.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search) ||
        s.tags.some((t) => t.toLowerCase().includes(search))
    );
  }

  return successResponse({ skills, total: skills.length });
}

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const body = await validateBody(request, createSkillSchema);

  const now = new Date().toISOString();
  const skillData = {
    ...body,
    orgId: user.userId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.SKILLS).add(skillData);

  return successResponse(
    { id: docRef.id, ...skillData },
    201
  );
}

export const GET = withAuth(handleGet, { skipCSRF: true });
export const POST = withAuth(handlePost);
