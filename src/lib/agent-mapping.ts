/**
 * Agent Mapping Service
 * Maps dashboard agent names to OpenClaw configurations and Slack IDs
 */

export interface AgentConfig {
  slackId: string;
  openclawId: string;
  role: string;
  capabilities: string[];
  heartbeatEnabled: boolean;
  taskFilters: string[];
}

export const AGENT_MAPPING: Record<string, AgentConfig> = {
  Jarvis: {
    slackId: 'U0AC3C0P8AZ',
    openclawId: 'jarvis',
    role: 'Chief of Staff / CMO',
    capabilities: ['strategy', 'coordination', 'planning', 'analytics'],
    heartbeatEnabled: true,
    taskFilters: ['management', 'coordination', 'strategy'],
  },
  Bolt: {
    slackId: 'U0AKGDJSVEG',
    openclawId: 'bolt',
    role: 'Dev & Engineering',
    capabilities: ['development', 'deployment', 'apis', 'devops'],
    heartbeatEnabled: true,
    taskFilters: ['development', 'technical', 'api', 'build'],
  },
  Aria: {
    slackId: 'U0AKGC1AW20',
    openclawId: 'aria',
    role: 'Creative Director',
    capabilities: ['design', 'branding', 'content', 'creative'],
    heartbeatEnabled: true,
    taskFilters: ['design', 'creative', 'brand', 'content'],
  },
  Scout: {
    slackId: 'U0AKRNBKDAM',
    openclawId: 'scout',
    role: 'Research & Strategy',
    capabilities: ['research', 'seo', 'analytics', 'strategy'],
    heartbeatEnabled: true,
    taskFilters: ['research', 'seo', 'analysis', 'strategy'],
  },
  Radar: {
    slackId: 'U0AKRR5MGG1',
    openclawId: 'radar',
    role: 'Analytics & Monitoring',
    capabilities: ['analytics', 'monitoring', 'reporting', 'data'],
    heartbeatEnabled: true,
    taskFilters: ['analytics', 'monitoring', 'data', 'reporting'],
  },
  Blaze: {
    slackId: 'U0AKUJ4MWFK',
    openclawId: 'blaze',
    role: 'Ads & Paid Media',
    capabilities: ['meta-ads', 'google-ads', 'campaigns', 'roi'],
    heartbeatEnabled: true,
    taskFilters: ['ads', 'campaigns', 'paid-media', 'marketing'],
  },
};

export const AGENT_IDENTITIES: Record<string, { name: string; role: string; color: string; emoji: string }> = {
  U0AC3C0P8AZ: { name: 'Jarvis', role: 'Chief of Staff / CMO', color: 'bg-blue-600', emoji: '🧠' },
  U0AKGDJSVEG: { name: 'Bolt', role: 'Dev & Engineering', color: 'bg-purple-600', emoji: '⚡' },
  U0AKGC1AW20: { name: 'Aria', role: 'Creative Director', color: 'bg-pink-600', emoji: '🎨' },
  U0AKRNBKDAM: { name: 'Scout', role: 'Research & Strategy', color: 'bg-green-600', emoji: '🔍' },
  U0AKRR5MGG1: { name: 'Radar', role: 'Analytics & Monitoring', color: 'bg-orange-600', emoji: '📡' },
  U0AKUJ4MWFK: { name: 'Blaze', role: 'Ads & Paid Media', color: 'bg-red-600', emoji: '🔥' },
  U0ABRB47U1M: { name: 'Jonny', role: 'CEO & Founder', color: 'bg-gray-800', emoji: '👤' },
};

export function getOpenClawAgent(name: string): AgentConfig | null {
  return AGENT_MAPPING[name] || null;
}

export function getAgentBySlackId(slackId: string) {
  for (const [name, config] of Object.entries(AGENT_MAPPING)) {
    if (config.slackId === slackId) {
      return { dashboardName: name, ...config };
    }
  }
  return null;
}

export function getHeartbeatAgents() {
  return Object.entries(AGENT_MAPPING)
    .filter(([, config]) => config.heartbeatEnabled)
    .map(([name, config]) => ({ dashboardName: name, ...config }));
}
