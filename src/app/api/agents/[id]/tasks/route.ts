import { NextRequest, NextResponse } from 'next/server';

const KANBAN_URL = 'https://kanban-project-ten-alpha.vercel.app/api/tasks';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agentName = id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();

  try {
    const kanbanRes = await fetch(KANBAN_URL, { next: { revalidate: 0 } });
    const kanban = await kanbanRes.json();
    const allTasks = kanban.success ? kanban.data : [];

    const myTasks = allTasks.filter((t: { assignee?: string; assignedToName?: string | string[] }) => {
      const assignee = t.assignee || t.assignedToName;
      const name = Array.isArray(assignee) ? assignee[0] : assignee;
      return name === agentName;
    });

    const grouped = {
      inProgress: myTasks.filter((t: { status: string }) => t.status === 'in-progress'),
      review: myTasks.filter((t: { status: string }) => t.status === 'review'),
      backlog: myTasks.filter((t: { status: string }) => t.status === 'backlog'),
      done: myTasks.filter((t: { status: string }) => t.status === 'done'),
    };

    return NextResponse.json({
      success: true,
      agent: agentName,
      tasks: grouped,
      counts: {
        inProgress: grouped.inProgress.length,
        review: grouped.review.length,
        backlog: grouped.backlog.length,
        done: grouped.done.length,
        total: myTasks.length,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agentName = id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();

  try {
    const body = await req.json();
    const { taskId, status } = body;

    if (!taskId || !status) {
      return NextResponse.json({ error: 'Missing taskId or status' }, { status: 400 });
    }

    const validStatuses = ['backlog', 'in-progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const patchRes = await fetch(`${KANBAN_URL.replace('/tasks', '')}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assignee: agentName }),
    });

    const result = await patchRes.json();

    if (!patchRes.ok) {
      return NextResponse.json({ success: false, error: result.error || 'Kanban update failed' }, { status: patchRes.status });
    }

    return NextResponse.json({
      success: true,
      taskId,
      agent: agentName,
      newStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
