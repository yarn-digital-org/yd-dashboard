import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  requireDb,
  AuthUser,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

/**
 * Returns cross-referenced data for a given entity.
 * Query params:
 *   type: 'agent' | 'task' | 'skill' | 'client'
 *   id: entity ID
 * 
 * Returns related entities from other collections.
 */
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!type || !id) {
    return successResponse({ error: 'type and id required' }, 400);
  }

  const orgId = user.userId;
  const results: Record<string, unknown[]> = {};

  if (type === 'agent') {
    // Get tasks assigned to this agent
    const tasksSnap = await db.collection(COLLECTIONS.TASKS)
      .where('orgId', '==', orgId)
      .where('assignedTo', '==', id)
      .get();
    results.tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get skills that reference this agent
    const skillsSnap = await db.collection(COLLECTIONS.SKILLS)
      .where('orgId', '==', orgId)
      .where('agentIds', 'array-contains', id)
      .get();
    results.skills = skillsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get clients this agent works on (via tasks)
    const clientIds = [...new Set(
      tasksSnap.docs.map(d => d.data().clientId).filter(Boolean)
    )];
    if (clientIds.length > 0) {
      const clientDocs = await Promise.all(
        clientIds.slice(0, 10).map(cid => 
          db.collection(COLLECTIONS.CLIENT_DOCS).doc(cid).get()
        )
      );
      results.clients = clientDocs
        .filter(d => d.exists && d.data()?.orgId === orgId)
        .map(d => ({ id: d.id, ...d.data() }));
    } else {
      results.clients = [];
    }
  }

  if (type === 'client') {
    // Get tasks for this client
    const tasksSnap = await db.collection(COLLECTIONS.TASKS)
      .where('orgId', '==', orgId)
      .where('clientId', '==', id)
      .get();
    results.tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get agents working on this client (via tasks)
    const agentIds = [...new Set(
      tasksSnap.docs.map(d => d.data().assignedTo).filter(Boolean)
    )];
    if (agentIds.length > 0) {
      const agentDocs = await Promise.all(
        agentIds.slice(0, 10).map(aid => 
          db.collection(COLLECTIONS.AGENTS).doc(aid).get()
        )
      );
      results.agents = agentDocs
        .filter(d => d.exists && d.data()?.orgId === orgId)
        .map(d => ({ id: d.id, ...d.data() }));
    } else {
      results.agents = [];
    }

    // Get all skills (for display)
    const skillsSnap = await db.collection(COLLECTIONS.SKILLS)
      .where('orgId', '==', orgId)
      .get();
    results.skills = skillsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  if (type === 'skill') {
    // Get agents with this skill
    const agentsSnap = await db.collection(COLLECTIONS.AGENTS)
      .where('orgId', '==', orgId)
      .get();
    // Filter client-side since we need to check the skill name in the skills array
    const skillDoc = await db.collection(COLLECTIONS.SKILLS).doc(id).get();
    const skillData = skillDoc.data();
    
    results.agents = agentsSnap.docs
      .filter(d => {
        const agent = d.data();
        return (agent.skillIds || []).includes(id) || 
               (skillData?.agentIds || []).includes(d.id);
      })
      .map(d => ({ id: d.id, ...d.data() }));

    // Get tasks that use this skill
    const tasksSnap = await db.collection(COLLECTIONS.TASKS)
      .where('orgId', '==', orgId)
      .get();
    results.tasks = tasksSnap.docs
      .filter(d => (d.data().skillIds || []).includes(id))
      .map(d => ({ id: d.id, ...d.data() }));
  }

  if (type === 'task') {
    // Get all agents (for assignment dropdown)
    const agentsSnap = await db.collection(COLLECTIONS.AGENTS)
      .where('orgId', '==', orgId)
      .get();
    results.agents = agentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get all clients (for client dropdown)
    const clientsSnap = await db.collection(COLLECTIONS.CLIENT_DOCS)
      .where('orgId', '==', orgId)
      .get();
    results.clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get all skills (for skill assignment)
    const skillsSnap = await db.collection(COLLECTIONS.SKILLS)
      .where('orgId', '==', orgId)
      .get();
    results.skills = skillsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  return successResponse(results);
}

export const GET = withAuth(handleGet as any, { skipCSRF: true });
