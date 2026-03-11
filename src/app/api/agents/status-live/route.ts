import { NextRequest, NextResponse } from 'next/server';
import { AGENT_MAPPING } from '@/lib/agent-mapping';

const KANBAN_URL = 'https://kanban-project-ten-alpha.vercel.app/api/tasks';

export async function GET(req: NextRequest) {
  try {
    const kanbanRes = await fetch(KANBAN_URL, { next: { revalidate: 0 } });
    const kanban = await kanbanRes.json();
    const tasks = kanban.success ? kanban.data : [];

    // Build per-agent task map
    const tasksByAgent: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      const assignee = task.assignee || task.assignedToName;
      if (!assignee) continue;
      const name = Array.isArray(assignee) ? assignee[0] : assignee;
      if (!tasksByAgent[name]) tasksByAgent[name] = [];
      tasksByAgent[name].push(task);
    }

    const agents = Object.entries(AGENT_MAPPING).map(([name, config]) => {
      const agentTasks = tasksByAgent[name] || [];
      const inProgress = agentTasks.filter((t: { status: string }) => t.status === 'in-progress');
      const inReview = agentTasks.filter((t: { status: string }) => t.status === 'review');
      const backlog = agentTasks.filter((t: { status: string }) => t.status === 'backlog');
      const done = agentTasks.filter((t: { status: string }) => t.status === 'done');

      const status = inProgress.length > 0 ? 'working' : 'idle';

      return {
        name,
        role: config.role,
        slackId: config.slackId,
        status,
        currentTask: inProgress[0]
          ? { id: inProgress[0].id, title: inProgress[0].title, dueDate: inProgress[0].dueDate }
          : null,
        taskCounts: {
          inProgress: inProgress.length,
          inReview: inReview.length,
          backlog: backlog.length,
          done: done.length,
          total: agentTasks.length,
        },
        allInProgressTasks: inProgress.map((t: { id: string; title: string; dueDate?: string }) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      agents,
      meta: {
        source: 'kanban-project-ten-alpha.vercel.app',
        generatedAt: new Date().toISOString(),
        working: agents.filter(a => a.status === 'working').length,
        idle: agents.filter(a => a.status === 'idle').length,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
