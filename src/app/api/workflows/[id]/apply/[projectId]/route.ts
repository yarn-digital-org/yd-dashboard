import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { 
  withAuth, 
  successResponse, 
  requireDb,
  AuthUser,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-middleware';
import { WorkflowTemplate, Project, WorkflowTask, COLLECTIONS } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Helper: Get workflow by ID
// ============================================

async function getWorkflow(db: FirebaseFirestore.Firestore, id: string, userId: string) {
  const doc = await db.collection(COLLECTIONS.WORKFLOW_TEMPLATES).doc(id).get();
  
  if (!doc.exists) {
    throw new NotFoundError('Workflow template not found');
  }

  const workflow = { id: doc.id, ...doc.data() } as WorkflowTemplate;
  
  if (workflow.userId !== userId) {
    throw new ForbiddenError('You do not have access to this workflow');
  }

  return workflow;
}

// ============================================
// Helper: Get project by ID
// ============================================

async function getProject(db: FirebaseFirestore.Firestore, id: string, userId: string) {
  const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get();
  
  if (!doc.exists) {
    throw new NotFoundError('Project not found');
  }

  const project = { id: doc.id, ...doc.data() } as Project;
  
  if (project.userId !== userId) {
    throw new ForbiddenError('You do not have access to this project');
  }

  return project;
}

// ============================================
// Helper: Calculate due date from offset
// ============================================

function calculateDueDate(
  dueFrom: 'start_date' | 'event_date',
  dueDaysOffset: number | undefined,
  startDate: string | undefined,
  eventDate: string | undefined
): string | undefined {
  if (dueDaysOffset === undefined) return undefined;

  const baseDate = dueFrom === 'event_date' && eventDate 
    ? new Date(eventDate) 
    : startDate 
      ? new Date(startDate) 
      : new Date();

  baseDate.setDate(baseDate.getDate() + dueDaysOffset);
  return baseDate.toISOString();
}

// ============================================
// POST - Apply workflow template to project
// ============================================

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id, projectId } = await context.params;

  // Get workflow template
  const workflow = await getWorkflow(db, id, user.userId);
  
  // Get project
  const project = await getProject(db, projectId, user.userId);

  // Transform template tasks to project tasks
  const workflowTasks: WorkflowTask[] = workflow.tasks.map((templateTask) => ({
    id: uuidv4(),
    name: templateTask.name,
    description: templateTask.description,
    order: templateTask.order,
    isCompleted: false,
    completedAt: undefined,
    dueDate: calculateDueDate(
      templateTask.dueFrom,
      templateTask.dueDaysOffset,
      project.startDate,
      project.eventDate
    ),
    subtasks: templateTask.subtasks.map(subtask => ({
      id: uuidv4(),
      name: subtask.name,
      isCompleted: false,
    })),
    labels: templateTask.labels,
  }));

  // Update project with workflow tasks
  const now = new Date().toISOString();
  await db.collection(COLLECTIONS.PROJECTS).doc(projectId).update({
    workflowId: id,
    workflowTasks,
    updatedAt: now,
  });

  // Increment workflow usage count
  await db.collection(COLLECTIONS.WORKFLOW_TEMPLATES).doc(id).update({
    usageCount: (workflow.usageCount || 0) + 1,
    updatedAt: now,
  });

  // Fetch updated project
  const updatedProject = await getProject(db, projectId, user.userId);

  return successResponse({
    project: updatedProject,
    tasksApplied: workflowTasks.length,
    message: `Applied ${workflowTasks.length} tasks from "${workflow.name}" to project`,
  });
}

// ============================================
// Export handler with auth wrapper
// ============================================

export const POST = withAuth(handlePost);
