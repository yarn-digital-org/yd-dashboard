import { NextRequest, NextResponse } from 'next/server';

const KANBAN_URL = 'https://kanban-project-ten-alpha.vercel.app/api/tasks';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agent } = body;

    if (!agent) {
      return NextResponse.json({ error: 'Missing required field: agent' }, { status: 400 });
    }

    const kanbanRes = await fetch(KANBAN_URL, { next: { revalidate: 0 } });
    const kanban = await kanbanRes.json();
    const tasks = kanban.success ? kanban.data : [];

    const myTasks = tasks.filter((t: { assignee?: string; assignedToName?: string | string[] }) => {
      const assignee = t.assignee || t.assignedToName;
      const name = Array.isArray(assignee) ? assignee[0] : assignee;
      return name === agent;
    });

    const inProgress = myTasks.filter((t: { status: string }) => t.status === 'in-progress');
    const backlog = myTasks.filter((t: { status: string }) => t.status === 'backlog');

    let directive = 'HEARTBEAT_OK';
    let currentTask = null;
    let nextTask = null;

    if (inProgress.length > 0) {
      directive = 'CONTINUE';
      currentTask = inProgress[0];
    } else if (backlog.length > 0) {
      directive = 'START';
      nextTask = backlog.sort((a: { dueDate?: string }, b: { dueDate?: string }) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })[0];
    }

    return NextResponse.json({
      success: true,
      agent,
      directive,
      currentTask: currentTask
        ? { id: currentTask.id, title: currentTask.title, description: currentTask.description, dueDate: currentTask.dueDate }
        : null,
      nextTask: nextTask
        ? { id: nextTask.id, title: nextTask.title, description: nextTask.description, dueDate: nextTask.dueDate }
        : null,
      taskCounts: { inProgress: inProgress.length, backlog: backlog.length, total: myTasks.length },
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
