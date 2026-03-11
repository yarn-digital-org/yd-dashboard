/**
 * Agent Mapping Service
 * Maps dashboard agent names to OpenClaw configurations and Slack IDs
 */

// Agent mapping configuration based on IDENTITY.md
export const AGENT_MAPPING = {
  // Dashboard agent name → OpenClaw agent details
  'Jarvis': {
    slackId: 'U0AC3C0P8AZ',
    openclawId: 'jarvis',
    role: 'Chief of Staff / CMO',
    capabilities: ['strategy', 'coordination', 'planning', 'analytics'],
    heartbeatEnabled: true,
    taskFilters: ['management', 'coordination', 'strategy']
  },
  'Bolt': {
    slackId: 'U0AKGDJSVEG',
    openclawId: 'bolt',
    role: 'Dev & Engineering',
    capabilities: ['development', 'deployment', 'apis', 'devops'],
    heartbeatEnabled: true,
    taskFilters: ['development', 'technical', 'api', 'build']
  },
  'Aria': {
    slackId: 'U0AKGC1AW20',
    openclawId: 'aria',
    role: 'Creative Director',
    capabilities: ['design', 'branding', 'content', 'creative'],
    heartbeatEnabled: true,
    taskFilters: ['design', 'creative', 'brand', 'content']
  },
  'Scout': {
    slackId: 'U0AKRNBKDAM',
    openclawId: 'scout',
    role: 'Research & Strategy',
    capabilities: ['research', 'seo', 'analytics', 'strategy'],
    heartbeatEnabled: true,
    taskFilters: ['research', 'seo', 'analysis', 'strategy']
  },
  'Radar': {
    slackId: 'U0AKRR5MGG1',
    openclawId: 'radar',
    role: 'Analytics & Monitoring',
    capabilities: ['analytics', 'monitoring', 'reporting', 'data'],
    heartbeatEnabled: true,
    taskFilters: ['analytics', 'monitoring', 'data', 'reporting']
  },
  'Blaze': {
    slackId: 'U0AKUJ4MWFK',
    openclawId: 'blaze',
    role: 'Ads & Paid Media',
    capabilities: ['meta-ads', 'google-ads', 'campaigns', 'roi'],
    heartbeatEnabled: true,
    taskFilters: ['ads', 'campaigns', 'paid-media', 'marketing']
  }
};

/**
 * Get OpenClaw agent details by dashboard agent name
 * @param {string} dashboardAgentName - Agent name from dashboard
 * @returns {object|null} OpenClaw agent configuration
 */
export function getOpenClawAgent(dashboardAgentName) {
  return AGENT_MAPPING[dashboardAgentName] || null;
}

/**
 * Get dashboard agent name by OpenClaw agent ID
 * @param {string} openclawId - OpenClaw agent ID
 * @returns {string|null} Dashboard agent name
 */
export function getDashboardAgentName(openclawId) {
  for (const [name, config] of Object.entries(AGENT_MAPPING)) {
    if (config.openclawId === openclawId) {
      return name;
    }
  }
  return null;
}

/**
 * Get agent by Slack ID
 * @param {string} slackId - Slack user ID
 * @returns {object|null} Agent configuration with dashboard name
 */
export function getAgentBySlackId(slackId) {
  for (const [name, config] of Object.entries(AGENT_MAPPING)) {
    if (config.slackId === slackId) {
      return {
        dashboardName: name,
        ...config
      };
    }
  }
  return null;
}

/**
 * Check if an agent is eligible for automatic task pickup
 * @param {string} dashboardAgentName - Agent name from dashboard
 * @returns {boolean} True if agent can auto-pickup tasks
 */
export function canAutoPickupTasks(dashboardAgentName) {
  const agent = getOpenClawAgent(dashboardAgentName);
  return agent && agent.heartbeatEnabled;
}

/**
 * Check if a task matches an agent's capabilities
 * @param {object} task - Task object with title and description
 * @param {string} dashboardAgentName - Agent name from dashboard
 * @returns {boolean} True if task matches agent's filters
 */
export function taskMatchesAgent(task, dashboardAgentName) {
  const agent = getOpenClawAgent(dashboardAgentName);
  if (!agent || !agent.taskFilters) return false;

  const taskText = `${task.title} ${task.description}`.toLowerCase();
  return agent.taskFilters.some(filter => taskText.includes(filter));
}

/**
 * Get all agents that can handle heartbeat operations
 * @returns {Array} Array of heartbeat-enabled agents
 */
export function getHeartbeatAgents() {
  return Object.entries(AGENT_MAPPING)
    .filter(([name, config]) => config.heartbeatEnabled)
    .map(([name, config]) => ({
      dashboardName: name,
      ...config
    }));
}

/**
 * Generate OpenClaw task queue URL for an agent
 * @param {string} dashboardAgentName - Agent name from dashboard
 * @returns {string} Task queue URL
 */
export function getAgentTaskQueueUrl(dashboardAgentName) {
  const agent = getOpenClawAgent(dashboardAgentName);
  if (!agent) return null;
  
  // Return URL that agent can use to fetch their tasks
  return `${process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://yd-dashboard.vercel.app'}/api/agents/${agent.openclawId}/tasks`;
}

export default AGENT_MAPPING;