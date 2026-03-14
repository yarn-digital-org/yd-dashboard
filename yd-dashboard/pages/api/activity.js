// Activity Feed API - live agent activity from kanban tasks
// GET /api/activity

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const kanbanRes = await fetch('https://kanban-project-ten-alpha.vercel.app/api/tasks');
    const kanban = await kanbanRes.json();
    const tasks = kanban.success ? kanban.data : [];

    const now = new Date();

    // Build activity list from task statuses
    const activities = [];

    // In-progress tasks = active work
    tasks
      .filter(t => t.status === 'in-progress' && t.assignee)
      .forEach(t => {
        activities.push({
          id: t.id,
          agentName: t.assignee,
          action: 'Working on',
          taskTitle: t.title,
          taskId: t.id,
          status: 'in-progress',
          type: 'working',
          timestamp: now.toISOString(),
        });
      });

    // Review tasks = recently completed / awaiting review
    tasks
      .filter(t => t.status === 'review' && t.assignee)
      .slice(0, 10)
      .forEach(t => {
        activities.push({
          id: `${t.id}-review`,
          agentName: t.assignee,
          action: 'Submitted for review',
          taskTitle: t.title,
          taskId: t.id,
          status: 'review',
          type: 'review',
          timestamp: now.toISOString(),
        });
      });

    // Done tasks
    tasks
      .filter(t => t.status === 'done' && t.assignee)
      .slice(0, 5)
      .forEach(t => {
        activities.push({
          id: `${t.id}-done`,
          agentName: t.assignee,
          action: 'Completed',
          taskTitle: t.title,
          taskId: t.id,
          status: 'done',
          type: 'completed',
          timestamp: now.toISOString(),
        });
      });

    // Overdue tasks = blocked / needs attention
    tasks
      .filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        return new Date(t.dueDate) < now;
      })
      .slice(0, 5)
      .forEach(t => {
        activities.push({
          id: `${t.id}-overdue`,
          agentName: t.assignee || 'Unassigned',
          action: 'Overdue',
          taskTitle: t.title,
          taskId: t.id,
          status: 'overdue',
          type: 'blocked',
          timestamp: now.toISOString(),
        });
      });

    // Sort: working first, then review, then done
    const order = { working: 0, review: 1, completed: 2, blocked: 3 };
    activities.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

    // Stats
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const reviewCount = tasks.filter(t => t.status === 'review').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const backlogCount = tasks.filter(t => t.status === 'backlog').length;

    const agentNames = ['Bolt', 'Aria', 'Scout', 'Radar', 'Blaze', 'Jarvis'];
    const workingAgents = agentNames.filter(name =>
      tasks.some(t => t.assignee === name && t.status === 'in-progress')
    );
    const idleAgents = agentNames.filter(name => !workingAgents.includes(name));

    res.status(200).json({
      success: true,
      activities: activities.slice(0, 20),
      stats: {
        working: workingAgents.length,
        idle: idleAgents.length,
        inProgress: inProgressCount,
        review: reviewCount,
        done: doneCount,
        backlog: backlogCount,
        total: tasks.length,
      },
      workingAgents,
      generatedAt: now.toISOString(),
    });

  } catch (err) {
    console.error('Activity feed error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
