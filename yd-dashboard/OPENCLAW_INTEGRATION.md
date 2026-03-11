# OpenClaw Agent Integration

This document explains how the YD Dashboard integrates with OpenClaw agents for automated task management.

## Overview

The integration connects dashboard agent profiles to real OpenClaw agent configurations, enabling automatic task pickup and status synchronization.

## Agent Mapping

Each dashboard agent is mapped to an OpenClaw agent configuration:

| Dashboard Agent | OpenClaw ID | Slack ID | Role |
|----------------|-------------|----------|------|
| Jarvis | `jarvis` | `U0AC3C0P8AZ` | Chief of Staff / CMO |
| Bolt | `bolt` | `U0AKGDJSVEG` | Dev & Engineering |
| Aria | `aria` | `U0AKGC1AW20` | Creative Director |
| Scout | `scout` | `U0AKRNBKDAM` | Research & Strategy |
| Radar | `radar` | `U0AKRR5MGG1` | Analytics & Monitoring |
| Blaze | `blaze` | `U0AKUJ4MWFK` | Ads & Paid Media |

## API Endpoints

### Agent Task Queue
**`GET /api/agents/[agentId]/tasks`**
- Fetch tasks assigned to a specific agent
- Returns in-progress tasks first, then backlog tasks
- Used by OpenClaw agents during heartbeat

**`PATCH /api/agents/[agentId]/tasks/[taskId]`**
- Update task status (backlog → in-progress → review)
- Automatically assigns task to agent when moved to in-progress

### Agent Status & Heartbeat
**`GET /api/agents/[agentId]/status`**
- Get agent configuration and current status
- Returns OpenClaw config, endpoints, and heartbeat data

**`POST /api/agents/[agentId]/status`**
- Update agent status with heartbeat information
- Tracks current task, completion count, and status

### Global Heartbeat
**`GET /api/agents/heartbeat`**
- Get all agent statuses for dashboard display
- Shows online/offline status based on recent heartbeats

**`POST /api/agents/heartbeat`**
- Central heartbeat endpoint for all agents
- Accepts agentId, slackId, or dashboardName for identification

## Heartbeat Integration

OpenClaw agents can integrate with the task system using their heartbeat functionality:

### 1. Check Task Queue
```bash
curl -s https://yd-dashboard.vercel.app/api/agents/bolt/tasks
```

### 2. Pick Up Task
```bash
curl -X PATCH https://yd-dashboard.vercel.app/api/agents/bolt/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress", "assignee": "Bolt"}'
```

### 3. Send Heartbeat
```bash
curl -X POST https://yd-dashboard.vercel.app/api/agents/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "bolt",
    "status": "active",
    "currentTask": "Building API integration",
    "tasksCompleted": 42
  }'
```

### 4. Complete Task
```bash
curl -X PATCH https://yd-dashboard.vercel.app/api/agents/bolt/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "review"}'
```

## OpenClaw HEARTBEAT.md Integration

Add this to your agent's HEARTBEAT.md file:

```bash
# Check for tasks
TASKS=$(curl -s https://yd-dashboard.vercel.app/api/agents/bolt/tasks | jq '.data.tasks // []')

# Check if there are tasks to work on
if [ $(echo "$TASKS" | jq 'length') -gt 0 ]; then
  # Get the first task (highest priority)
  TASK_ID=$(echo "$TASKS" | jq -r '.[0].id')
  TASK_TITLE=$(echo "$TASKS" | jq -r '.[0].title')
  TASK_STATUS=$(echo "$TASKS" | jq -r '.[0].status')
  
  # If task is in backlog, start working on it
  if [ "$TASK_STATUS" = "backlog" ]; then
    curl -X PATCH "https://yd-dashboard.vercel.app/api/agents/bolt/tasks/$TASK_ID" \
      -H "Content-Type: application/json" \
      -d '{"status": "in-progress", "assignee": "Bolt"}'
    
    # Send heartbeat with current task
    curl -X POST https://yd-dashboard.vercel.app/api/agents/heartbeat \
      -H "Content-Type: application/json" \
      -d "{\"agentId\": \"bolt\", \"status\": \"active\", \"currentTask\": \"$TASK_TITLE\"}"
    
    # Continue working on the task...
    echo "Starting work on: $TASK_TITLE"
  fi
else
  # No tasks - send idle heartbeat
  curl -X POST https://yd-dashboard.vercel.app/api/agents/heartbeat \
    -H "Content-Type: application/json" \
    -d '{"agentId": "bolt", "status": "idle"}'
  
  echo "HEARTBEAT_OK"
fi
```

## Task Status Flow

1. **backlog** → Task is waiting to be picked up
2. **in-progress** → Agent is actively working on task
3. **review** → Task is completed, waiting for review
4. **done** → Task is approved and archived (manual step by Jonny)

## Agent Capabilities

Each agent has defined capabilities that can be used for automatic task assignment:

- **Jarvis**: strategy, coordination, planning, analytics
- **Bolt**: development, deployment, apis, devops  
- **Aria**: design, branding, content, creative
- **Scout**: research, seo, analytics, strategy
- **Radar**: analytics, monitoring, reporting, data
- **Blaze**: meta-ads, google-ads, campaigns, roi

## Dashboard Features

### Team Page
- Real-time agent status display
- OpenClaw connection indicators (Wifi/WifiOff icons)
- Current task display
- Integration status with agent IDs

### Live Updates
- Agent statuses refresh every 30 seconds
- Online/offline detection (5-minute timeout)
- Current task and completion tracking

## Security

- No authentication required for read endpoints (public status)
- Write operations (task updates, heartbeats) are open for now
- In production, implement API key authentication

## Environment Variables

Add to `.env.local`:

```bash
# Dashboard URL for agent task queue URLs
NEXT_PUBLIC_DASHBOARD_URL=https://yd-dashboard.vercel.app

# Optional: Kanban board API URL (defaults to current)
KANBAN_API_URL=https://kanban-project-ten-alpha.vercel.app/api
```

## Files Created

1. **`lib/agent-mapping.js`** - Agent configuration mapping
2. **`pages/api/agents/[agentId]/tasks.js`** - Task queue API
3. **`pages/api/agents/[agentId]/status.js`** - Agent status API  
4. **`pages/api/agents/heartbeat.js`** - Central heartbeat API
5. **`pages/team.js`** - Updated team page with live data

## Testing

Test the integration with curl commands:

```bash
# Check agent status
curl https://yd-dashboard.vercel.app/api/agents/bolt/status

# Get agent tasks  
curl https://yd-dashboard.vercel.app/api/agents/bolt/tasks

# Send heartbeat
curl -X POST https://yd-dashboard.vercel.app/api/agents/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"agentId": "bolt", "status": "active", "currentTask": "Testing integration"}'

# View all agent statuses
curl https://yd-dashboard.vercel.app/api/agents/heartbeat
```

## Next Steps

1. Deploy to production with build verification
2. Update OpenClaw agent HEARTBEAT.md files to use the API
3. Test automated task pickup with real agents
4. Add authentication and rate limiting for production use
5. Implement persistent storage (Redis/database) for heartbeat data