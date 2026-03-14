// Daily Summary Report API
// GET /api/daily-summary

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const kanbanRes = await fetch('https://kanban-project-ten-alpha.vercel.app/api/tasks');
    const kanban = await kanbanRes.json();
    const tasks = kanban.success ? kanban.data : [];

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const agentNames = ['Bolt', 'Aria', 'Scout', 'Radar', 'Blaze', 'Jarvis'];

    // Group tasks by status
    const inProgress = tasks.filter(t => t.status === 'in-progress');
    const inReview = tasks.filter(t => t.status === 'review');
    const done = tasks.filter(t => t.status === 'done');
    const backlog = tasks.filter(t => t.status === 'backlog');

    // Overdue = has dueDate < today and not done
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return t.dueDate < today;
    });

    // Needs attention = overdue or in-progress with no assignee
    const needsAttention = [
      ...overdue.map(t => ({
        ...t,
        reason: `Overdue since ${t.dueDate}`,
      })),
      ...tasks.filter(t => t.status === 'in-progress' && !t.assignee).map(t => ({
        ...t,
        reason: 'In progress but unassigned',
      })),
    ];

    // Agent statuses
    const agentStatuses = {};
    for (const name of agentNames) {
      const agentTasks = tasks.filter(t => t.assignee === name);
      const agentInProgress = agentTasks.filter(t => t.status === 'in-progress');
      agentStatuses[name] = {
        status: agentInProgress.length > 0 ? 'working' : 'idle',
        inProgress: agentInProgress.length,
        inReview: agentTasks.filter(t => t.status === 'review').length,
        done: agentTasks.filter(t => t.status === 'done').length,
        currentTask: agentInProgress[0]?.title || null,
      };
    }

    // Highlights — human-readable insight strings
    const highlights = [];

    const workingAgents = agentNames.filter(n => agentStatuses[n].status === 'working');
    if (workingAgents.length > 0) {
      highlights.push(`${workingAgents.length} agent${workingAgents.length > 1 ? 's' : ''} actively working: ${workingAgents.join(', ')}`);
    }

    if (inReview.length > 0) {
      highlights.push(`${inReview.length} task${inReview.length > 1 ? 's' : ''} awaiting review`);
    }

    if (done.length > 0) {
      highlights.push(`${done.length} task${done.length > 1 ? 's' : ''} completed overall`);
    }

    if (overdue.length > 0) {
      highlights.push(`⚠️ ${overdue.length} task${overdue.length > 1 ? 's' : ''} overdue — needs attention`);
    }

    const agentsInReview = agentNames.filter(n => agentStatuses[n].inReview > 0);
    if (agentsInReview.length > 0) {
      const topAgent = agentsInReview.sort((a, b) => agentStatuses[b].inReview - agentStatuses[a].inReview)[0];
      highlights.push(`${topAgent} has the most tasks in review (${agentStatuses[topAgent].inReview})`);
    }

    res.status(200).json({
      success: true,
      summary: {
        date: today,
        generatedAt: now.toISOString(),
        inProgress: inProgress.map(t => ({ id: t.id, title: t.title, assignee: t.assignee, dueDate: t.dueDate })),
        inReview: inReview.slice(0, 10).map(t => ({ id: t.id, title: t.title, assignee: t.assignee, dueDate: t.dueDate })),
        done: done.map(t => ({ id: t.id, title: t.title, assignee: t.assignee })),
        backlog: backlog.map(t => ({ id: t.id, title: t.title, assignee: t.assignee })),
        overdue: overdue.map(t => ({ id: t.id, title: t.title, assignee: t.assignee, dueDate: t.dueDate })),
        needsAttention: needsAttention.slice(0, 5),
        agentStatuses,
        highlights,
        counts: {
          inProgress: inProgress.length,
          inReview: inReview.length,
          done: done.length,
          backlog: backlog.length,
          overdue: overdue.length,
          total: tasks.length,
        },
      },
    });

  } catch (err) {
    console.error('Daily summary error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
