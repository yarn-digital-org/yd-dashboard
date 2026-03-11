// Agent status API - maps dashboard agents to OpenClaw configs + live kanban tasks
// Config source: /root/.openclaw/workspaces/<agent>/
// Task source: kanban-project-ten-alpha.vercel.app/api/tasks

const fs = require('fs');
const path = require('path');

// Static OpenClaw config map - workspace paths and Slack IDs
const AGENT_CONFIG = {
  Bolt:   { workspace: 'bolt',   slackId: 'U0AKGDJSVEG', role: 'Dev & Engineering' },
  Aria:   { workspace: 'aria',   slackId: 'U0AKGC1AW20', role: 'Creative Director' },
  Scout:  { workspace: 'scout',  slackId: 'U0AKRNBKDAM', role: 'Research & Strategy' },
  Radar:  { workspace: 'radar',  slackId: 'U0AKRR5MGG1', role: 'Analytics & Monitoring' },
  Blaze:  { workspace: 'blaze',  slackId: 'U0AKUJ4MWFK', role: 'Ads & Paid Media' },
  Jarvis: { workspace: null,     slackId: 'U0AC3C0P8AZ', role: 'Chief of Staff' },
};

const WORKSPACE_ROOT = '/root/.openclaw/workspaces';

function readAgentMemory(workspaceName) {
  if (!workspaceName) return null;
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    for (const date of [today, yesterday]) {
      const memPath = path.join(WORKSPACE_ROOT, workspaceName, 'memory', `${date}.md`);
      if (fs.existsSync(memPath)) {
        const content = fs.readFileSync(memPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        // Return last meaningful line as current activity hint
        const lastLine = lines.reverse().find(l => !l.startsWith('#') && l.length > 10);
        return lastLine || null;
      }
    }
  } catch (e) {}
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch live task data from kanban
    const kanbanRes = await fetch('https://kanban-project-ten-alpha.vercel.app/api/tasks');
    const kanban = await kanbanRes.json();
    const tasks = kanban.success ? kanban.data : [];

    // Build per-agent task map
    const tasksByAgent = {};
    for (const task of tasks) {
      const assignee = task.assignee;
      if (!assignee) continue;
      if (!tasksByAgent[assignee]) tasksByAgent[assignee] = [];
      tasksByAgent[assignee].push(task);
    }

    // Build agent status objects
    const agents = Object.entries(AGENT_CONFIG).map(([name, config]) => {
      const agentTasks = tasksByAgent[name] || [];
      const inProgress = agentTasks.filter(t => t.status === 'in-progress');
      const inReview = agentTasks.filter(t => t.status === 'review');
      const backlog = agentTasks.filter(t => t.status === 'backlog');
      const done = agentTasks.filter(t => t.status === 'done');

      // Determine real status: working = has in-progress tasks, idle = no in-progress
      const status = inProgress.length > 0 ? 'working' : 'idle';

      const currentTask = inProgress[0] || null;

      return {
        name,
        role: config.role,
        slackId: config.slackId,
        workspace: config.workspace ? `${WORKSPACE_ROOT}/${config.workspace}` : null,
        status,
        currentTask: currentTask ? {
          id: currentTask.id,
          title: currentTask.title,
          dueDate: currentTask.dueDate,
          description: currentTask.description,
        } : null,
        taskCounts: {
          inProgress: inProgress.length,
          inReview: inReview.length,
          backlog: backlog.length,
          done: done.length,
          total: agentTasks.length,
        },
        allInProgressTasks: inProgress.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
        })),
      };
    });

    res.status(200).json({
      success: true,
      agents,
      meta: {
        source: 'kanban-project-ten-alpha.vercel.app',
        generatedAt: new Date().toISOString(),
        working: agents.filter(a => a.status === 'working').length,
        idle: agents.filter(a => a.status === 'idle').length,
      }
    });

  } catch (err) {
    console.error('Agent status error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
