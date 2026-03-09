# Agency OS — Dashboard Expansion Spec

## Overview
Expand yd-dashboard into a full agency operating system with agent team management, task management, skills library, and continuous learning.

## Tech Stack (Existing)
- Next.js 16 + React 19
- Firebase Firestore (client + admin SDK)
- Vercel deployment
- Lucide React icons
- Inline styles (no Tailwind — all components use React CSSProperties)
- Auth via AuthContext (`useAuth()`)
- Sidebar navigation pattern with Lucide icons

## Phase 1: Agent Team + Task Manager

### 1A: Agent Team Registry (`/agents`)

**Firebase Collection: `agents`**
```typescript
interface Agent {
  id: string;
  name: string;           // e.g. "Luna" 
  role: string;           // e.g. "Content Strategist"
  avatar: string;         // emoji or image URL
  status: 'active' | 'idle' | 'offline';
  description: string;    // What this agent does
  skills: string[];       // Skill IDs assigned to this agent
  slackChannel?: string;  // For inter-agent comms
  personality: string;    // Brief personality/approach description
  createdAt: Timestamp;
  updatedAt: Timestamp;
  orgId: string;
  stats: {
    tasksCompleted: number;
    tasksInProgress: number;
    learnings: number;
  };
}
```

**Dashboard Pages:**
- `/agents` — Grid view of all agents (card per agent showing avatar, name, role, status, task count)
- `/agents/[id]` — Agent detail page (profile, assigned skills, current tasks, activity log)
- `/agents/new` — Create new agent form
- Edit agent inline or via detail page

**Initial Agent Team (seed data):**
1. Content Strategist — Social media, content calendars, copywriting
2. SEO Specialist — Technical SEO, keyword research, on-page optimisation
3. Developer — Web dev, app building, technical implementation
4. Designer — Brand design, UI/UX, creative assets
5. Account Manager — Client comms, project coordination, reporting
6. Marketing Analyst — Data analysis, campaign tracking, ROAS optimisation

### 1B: Task Manager (`/tasks`)

**Firebase Collection: `tasks`**
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;     // Agent ID
  assignedToName: string; // Denormalized for display
  projectId?: string;     // Link to existing projects
  clientId?: string;      // Link to existing contacts
  labels: string[];
  dueDate?: Timestamp;
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;   // 0-6 for weekly
    dayOfMonth?: number;  // 1-31 for monthly
    nextDue?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  orgId: string;
  notes: string;
  feedbackNotes?: string; // What was learned from this task
}
```

**Firebase Collection: `taskLabels`**
```typescript
interface TaskLabel {
  id: string;
  name: string;
  color: string;
  orgId: string;
}
```

**Dashboard Pages:**
- `/tasks` — Main task view with tabs:
  - **Board View** (default) — Kanban columns: Backlog | In Progress | Review | Done
  - **List View** — Table with sortable columns (title, agent, status, priority, due date)
  - **Recurring** tab — Shows all recurring tasks with their schedules
- Filter by: agent, status, priority, label, project
- Drag-and-drop on kanban board (use HTML5 drag API — no extra deps)
- Quick-add task from any view
- Click task to open detail drawer/modal

### 1C: Sidebar Updates

Add to `navItems` array in Sidebar.tsx:
```
{ name: 'Agents', icon: Bot, href: '/agents' },
{ name: 'Tasks', icon: CheckSquare, href: '/tasks' },
```

Import `Bot` and `CheckSquare` from lucide-react. Place after Dashboard, before Leads.

### 1D: API Routes

**Agents:**
- `GET /api/agents` — List all agents for org
- `POST /api/agents` — Create agent
- `GET /api/agents/[id]` — Get agent detail
- `PUT /api/agents/[id]` — Update agent
- `DELETE /api/agents/[id]` — Delete agent

**Tasks:**
- `GET /api/tasks` — List tasks with filters (status, assignedTo, priority, isRecurring)
- `POST /api/tasks` — Create task
- `GET /api/tasks/[id]` — Get task detail
- `PUT /api/tasks/[id]` — Update task (including status changes for kanban)
- `DELETE /api/tasks/[id]` — Delete task
- `GET /api/task-labels` — Already exists, reuse

## Phase 2: Skills Library + Learnings (to follow)
- Separate GitHub repo: `yarn-digital/yd-skills`
- Dashboard reads/writes via GitHub API
- Import external skills from repos like GSD/TÂCHES
- Learnings collection in Firebase

## Design Guidelines
- Follow existing app style: white backgrounds, #FF3300 accent color, clean/minimal
- Inline React styles (CSSProperties) — NO Tailwind, NO CSS modules
- Responsive: mobile hamburger menu already exists
- Use existing patterns from leads/projects/contacts pages
- Cards with subtle shadows, rounded corners
- Status badges with colored dots
