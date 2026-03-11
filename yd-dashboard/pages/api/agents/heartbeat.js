// Agent heartbeat endpoint
// POST /api/agents/heartbeat — agent checks in, gets their current task assignment
// This is called by each agent's heartbeat loop to get work to do

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { agent } = req.body;

  if (!agent) {
    return res.status(400).json({ error: 'Missing required field: agent' });
  }

  try {
    // Fetch tasks from kanban
    const kanbanRes = await fetch('https://kanban-project-ten-alpha.vercel.app/api/tasks');
    const kanban = await kanbanRes.json();
    const tasks = kanban.success ? kanban.data : [];

    // Get this agent's tasks
    const myTasks = tasks.filter(t => t.assignee === agent);
    const inProgress = myTasks.filter(t => t.status === 'in-progress');
    const backlog = myTasks.filter(t => t.status === 'backlog');

    // Determine directive
    let directive = 'HEARTBEAT_OK';
    let currentTask = null;
    let nextTask = null;

    if (inProgress.length > 0) {
      directive = 'CONTINUE';
      currentTask = inProgress[0];
    } else if (backlog.length > 0) {
      directive = 'START';
      nextTask = backlog.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      })[0];
    }

    res.status(200).json({
      success: true,
      agent,
      directive,
      currentTask: currentTask ? {
        id: currentTask.id,
        title: currentTask.title,
        description: currentTask.description,
        dueDate: currentTask.dueDate,
      } : null,
      nextTask: nextTask ? {
        id: nextTask.id,
        title: nextTask.title,
        description: nextTask.description,
        dueDate: nextTask.dueDate,
      } : null,
      taskCounts: {
        inProgress: inProgress.length,
        backlog: backlog.length,
        total: myTasks.length,
      },
      checkedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
