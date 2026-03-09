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
import { Agent, AgentStatus, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.string().min(1, 'Role is required').max(200),
  avatar: z.string().optional(),
  status: z.enum(['active', 'idle', 'offline']).optional(),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
  slackChannel: z.string().optional(),
  personality: z.string().optional(),
});

// ============================================
// GET - List all agents
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status') as AgentStatus | null;
  const search = searchParams.get('search')?.toLowerCase();

  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.AGENTS)
    .where('orgId', '==', user.userId)
    .orderBy('name', 'asc');

  if (status) {
    query = db
      .collection(COLLECTIONS.AGENTS)
      .where('orgId', '==', user.userId)
      .where('status', '==', status)
      .orderBy('name', 'asc');
  }

  const snapshot = await query.get();
  let agents = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Agent[];

  if (search) {
    agents = agents.filter(a =>
      a.name?.toLowerCase().includes(search) ||
      a.role?.toLowerCase().includes(search) ||
      a.description?.toLowerCase().includes(search)
    );
  }

  return successResponse({
    agents,
    total: agents.length,
  });
}

// ============================================
// POST - Create new agent
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const data = await validateBody(request, createAgentSchema);

  const now = new Date().toISOString();

  const agent: Omit<Agent, 'id'> = {
    name: data.name.trim(),
    role: data.role.trim(),
    avatar: data.avatar || '🤖',
    status: data.status || 'active',
    description: data.description?.trim() || '',
    skills: data.skills || [],
    slackChannel: data.slackChannel?.trim() || undefined,
    personality: data.personality?.trim() || '',
    createdAt: now,
    updatedAt: now,
    orgId: user.userId,
    stats: {
      tasksCompleted: 0,
      tasksInProgress: 0,
      learnings: 0,
    },
  };

  const docRef = await db.collection(COLLECTIONS.AGENTS).add(agent);

  return successResponse(
    { id: docRef.id, ...agent },
    201
  );
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
