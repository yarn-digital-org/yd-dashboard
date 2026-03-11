// Per-agent task management
// GET  /api/agents/[agentId]/tasks — get tasks for a specific agent
// PATCH /api/agents/[agentId]/tasks/[taskId] — update task status

export default async function handler(req, res) {
  const { agentId } = req.query;

  if (!agentId) {
    return res.status(400).json({ error: 'Agent ID required' });
  }

  // Capitalise first letter to match kanban assignee names
  const agentName = agentId.charAt(0).toUpperCase() + agentId.slice(1).toLowerCase();

  if (req.method === 'GET') {
    try {
      const kanbanRes = await fetch('https://kanban-project-ten-alpha.vercel.app/api/tasks');
      const kanban = await kanbanRes.json();
      const allTasks = kanban.success ? kanban.data : [];

      const myTasks = allTasks.filter(t => t.assignee === agentName);

      // Group by status
      const grouped = {
        inProgress: myTasks.filter(t => t.status === 'in-progress'),
        review: myTasks.filter(t => t.status === 'review'),
        backlog: myTasks.filter(t => t.status === 'backlog'),
        done: myTasks.filter(t => t.status === 'done'),
      };

      return res.status(200).json({
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
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    const { taskId, status } = req.body;

    if (!taskId || !status) {
      return res.status(400).json({ error: 'Missing taskId or status' });
    }

    const validStatuses = ['backlog', 'in-progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
      const patchRes = await fetch(`https://kanban-project-ten-alpha.vercel.app/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assignee: agentName }),
      });

      const result = await patchRes.json();

      if (!patchRes.ok) {
        return res.status(patchRes.status).json({ success: false, error: result.error || 'Kanban update failed' });
      }

      return res.status(200).json({
        success: true,
        taskId,
        agent: agentName,
        newStatus: status,
        updatedAt: new Date().toISOString(),
      });

    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
