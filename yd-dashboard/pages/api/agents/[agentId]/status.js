/**
 * Agent Status API
 * Provides agent status information and heartbeat functionality
 * 
 * GET /api/agents/[agentId]/status - Get agent status and configuration
 * POST /api/agents/[agentId]/status - Update agent status (heartbeat)
 */

import { getDashboardAgentName, getOpenClawAgent, getAgentTaskQueueUrl } from '../../../../lib/agent-mapping';

// Simple in-memory store for agent heartbeats (in production, use Redis or database)
const agentHeartbeats = new Map();

export default async function handler(req, res) {
  const { agentId } = req.query;
  const dashboardAgentName = getDashboardAgentName(agentId);
  const agentConfig = getOpenClawAgent(dashboardAgentName);
  
  if (!agentConfig) {
    return res.status(404).json({
      success: false,
      error: `Agent '${agentId}' not found in mapping`
    });
  }

  if (req.method === 'GET') {
    // Get agent status and configuration
    const heartbeat = agentHeartbeats.get(agentId) || {
      lastSeen: null,
      status: 'offline',
      currentTask: null,
      tasksCompleted: 0
    };

    const now = new Date();
    const isOnline = heartbeat.lastSeen && 
      (now - new Date(heartbeat.lastSeen)) < 5 * 60 * 1000; // 5 minutes

    return res.status(200).json({
      success: true,
      data: {
        agentId,
        dashboardName: dashboardAgentName,
        openclawConfig: agentConfig,
        status: isOnline ? 'online' : 'offline',
        heartbeat: {
          ...heartbeat,
          isOnline,
          lastSeenAgo: heartbeat.lastSeen ? 
            Math.floor((now - new Date(heartbeat.lastSeen)) / 1000) : null
        },
        endpoints: {
          tasks: getAgentTaskQueueUrl(dashboardAgentName),
          status: `/api/agents/${agentId}/status`,
          heartbeat: `/api/agents/${agentId}/heartbeat`
        }
      }
    });
  }

  if (req.method === 'POST') {
    // Update agent status (heartbeat)
    try {
      const { 
        status = 'active', 
        currentTask = null, 
        tasksCompleted = null,
        message = null
      } = req.body;

      const now = new Date().toISOString();
      const existingHeartbeat = agentHeartbeats.get(agentId) || {};

      const updatedHeartbeat = {
        ...existingHeartbeat,
        lastSeen: now,
        status,
        currentTask,
        message,
        ...(tasksCompleted !== null && { tasksCompleted })
      };

      agentHeartbeats.set(agentId, updatedHeartbeat);

      return res.status(200).json({
        success: true,
        data: {
          agentId,
          dashboardName: dashboardAgentName,
          heartbeat: updatedHeartbeat,
          timestamp: now,
          message: 'Heartbeat received'
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `Failed to update agent status: ${error.message}`
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`
  });
}