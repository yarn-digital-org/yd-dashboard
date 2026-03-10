import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  errorResponse,
  requireDb,
  AuthUser,
} from '@/lib/api-middleware';
import { z } from 'zod';

const COLLECTION = 'openclaw_cron_jobs';

// ============================================
// GET - List cron jobs
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const snapshot = await db.collection(COLLECTION).get();
  const jobs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort by name
  jobs.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

  return successResponse({ jobs, total: jobs.length });
}

// ============================================
// POST - Create a new cron job (queued for sync)
// ============================================

const createCronSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  message: z.string().min(1, 'Cron job message/instruction is required'),
  taskId: z.string().optional(), // Link to a task if created from one
  enabled: z.boolean().optional(),
});

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const body = await request.json();

  const parsed = createCronSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues.map(e => e.message).join(', '),
      400,
      'VALIDATION_ERROR'
    );
  }

  const { name, description, frequency, message, taskId, enabled } = parsed.data;

  // Convert frequency to everyMs
  const freqToMs: Record<string, number> = {
    hourly: 3600000,
    daily: 86400000,
    weekly: 604800000,
    monthly: 2592000000, // ~30 days
  };

  const now = Date.now();
  const cronJob = {
    name,
    description: description || '',
    enabled: enabled ?? true,
    schedule: {
      kind: 'every',
      everyMs: freqToMs[frequency],
      anchorMs: now,
    },
    payload: {
      kind: 'agentTurn',
      message,
      timeoutSeconds: 300,
    },
    state: {},
    agentId: 'main',
    sessionTarget: 'isolated',
    taskId: taskId || null,
    createdAtMs: now,
    updatedAtMs: now,
    pendingSync: true, // Flag for local sync script to pick up
    syncedAt: null,
  };

  const docRef = await db.collection(COLLECTION).add(cronJob);

  return successResponse(
    { id: docRef.id, ...cronJob },
    201
  );
}

// ============================================
// PUT - Enable/disable a cron job
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const body = await request.json();
  const { id, enabled } = body;

  if (!id || typeof enabled !== 'boolean') {
    return errorResponse('Missing id or enabled field', 400, 'BAD_REQUEST');
  }

  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return errorResponse('Cron job not found', 404, 'NOT_FOUND');
  }

  await docRef.update({ enabled, updatedAtMs: Date.now(), pendingSync: true });

  return successResponse({ id, enabled });
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
export const PUT = withAuth(handlePut);
