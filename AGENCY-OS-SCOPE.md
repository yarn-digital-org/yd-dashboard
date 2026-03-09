# Agency OS — Scope Document

**Project:** Yarn Digital Dashboard → Agency Operating System
**Base URL:** https://yd-dashboard.vercel.app
**Stack:** Next.js + Firebase Firestore + Vercel
**Owner:** Jonny, Yarn Digital
**Created:** 9 March 2026

---

## Vision

Transform the existing YD Dashboard into a full agency operating system — a single platform where Jonny can see, manage, and direct an autonomous AI agent team, their tasks, skills, and learnings.

---

## Phase 1: Agent Registry + Task Manager ✅ COMPLETE

**Deployed:** 9 March 2026

### Agent Team (`/agents`)
- Grid view of all persistent agents
- Create, edit, delete agents
- Each agent has: name, role, avatar (emoji), status (active/idle/offline), description, skills list, Slack channel, personality
- Default team seeded: Aria (Content Strategist), Scout (SEO Specialist), Bolt (Developer), Radar (Marketing Analyst)
- Agent stats: tasks completed, tasks in progress, learnings count

### Task Manager (`/tasks`)
- **Kanban board** — drag-and-drop cards across columns: Backlog → In Progress → Review → Done → Archived
- **List view** — sortable table with all task details
- **Recurring tasks tab** — tasks with daily/weekly/monthly schedules
- Assign tasks to agents
- Priority levels: Low, Medium, High, Urgent
- Labels, due dates, notes, feedback notes
- Filter by agent, status, priority, search

### API Routes
- `GET/POST /api/agents` — list and create agents
- `GET/PUT/DELETE /api/agents/[id]` — individual agent CRUD
- `POST /api/agents/seed` — seed default team
- `GET/POST /api/tasks` — list and create tasks
- `GET/PUT/DELETE /api/tasks/[id]` — individual task CRUD

---

## Phase 2: Skills Library + Learning System

**Target:** Week of 10–16 March 2026

### Skills Library (`/skills`)
- **GitHub-backed:** Skills stored as markdown files in `yarn-digital/yd-skills` repo
- Browse all skills in a folder/file tree view
- Click to read skill content (rendered markdown)
- Inline editor — edit skills directly in the dashboard, commits back to GitHub
- Assign skills to agents (link skills → agent profiles)
- Import external skill repos (e.g. community skills from GSD/TÂCHES)
- Version history via Git (show last modified, commit messages)

#### Skill File Structure
```
yd-skills/
├── content/
│   ├── social-media-posting.md
│   ├── blog-writing.md
│   └── brand-voice-guide.md
├── seo/
│   ├── keyword-research.md
│   ├── on-page-audit.md
│   └── competitor-analysis.md
├── development/
│   ├── next-js-deployment.md
│   ├── firebase-patterns.md
│   └── vercel-config.md
├── marketing/
│   ├── lead-qualification.md
│   ├── ad-campaign-setup.md
│   └── analytics-reporting.md
└── README.md
```

### Client Knowledge Base (`/clients`)
- **GitHub-backed:** Client docs stored alongside skills in the same repo
- Each client gets a folder with living documents that are updated continuously
- Dashboard UI to browse, edit, and update client docs
- Agents reference client docs when working on client tasks — full context always available
- When we learn new info about a client (meetings, feedback, decisions), docs get updated immediately

#### Client File Structure
Separate repo from skills — `yarn-digital/yd-clients`
```
yd-clients/
├── yellowbear/
    │   ├── overview.md          (business summary, relationship, key contacts)
    │   ├── contacts.md          (Ciaran, Deirdre, etc.)
    │   ├── myclaims-offer.md    (Phase 1 web app spec)
    │   ├── yellowbear-app.md    (Phase 2 native app spec)
    │   ├── marketing-strategy.md
    │   └── meeting-notes/
    │       └── 2026-03-XX.md
    ├── stonebridge-farm/
    │   ├── overview.md
    │   └── branding.md
    ├── krumb-bakery/
    │   ├── overview.md
    │   └── project-history.md
    ├── react-clarity/
    │   └── overview.md
├── the-hills-restaurant/
│   └── overview.md
└── _template/
    └── overview.md          (template for new clients)
```

#### Client Overview Template (overview.md)
Each client overview should include:
- Business name, industry, location
- Key contacts (names, roles, email, phone)
- Relationship status (active/prospect/past)
- Services we provide
- Current projects & status
- Brand guidelines / tone of voice notes
- Important decisions & history
- Budget / commercial notes (if relevant)

### Learning/Feedback System (`/learnings`)
- When a task is completed or a problem solved, capture the learning
- Each learning has: title, description, category, linked task, linked skill, date
- Learnings feed back into skills — if we learn something, update the relevant skill file
- Searchable knowledge base that grows over time
- Dashboard view: recent learnings, filterable by category/agent
- Optional: auto-suggest skill updates based on new learnings

### Required Setup
- GitHub Personal Access Token (fine-grained, scoped to yd-skills + yd-clients repos)
- Create `yarn-digital/yd-skills` repo on GitHub
- Create `yarn-digital/yd-clients` repo on GitHub (separate from skills)
- Firebase collection: `learnings`

---

## Phase 3: Integration + Autonomy

**Target:** Week of 17–23 March 2026

### OpenClaw Agent Integration
- Agents in the dashboard map to real OpenClaw agent configs
- When a task is assigned, the agent can pick it up autonomously
- Agents report progress back to dashboard (status updates, completion)
- Heartbeat system: agents check their task queue periodically and work through backlog

### Inter-Agent Communication (Slack)
- Each agent gets a Slack channel (or shared #agent-comms channel)
- Agents can message each other for cross-functional work
- Jonny can see agent conversations in Slack
- Dashboard shows recent agent communications

### Real-Time Updates
- Dashboard reflects live agent activity
- Task status updates in real-time as agents work
- Notification system for completed tasks, blockers, urgent items

### Autonomous Operation
- System runs between Jonny's conversations
- Agents pull from backlog, work tasks, move to review
- Only Jonny moves tasks to Done/Archived
- Daily summary: what was worked on, what's blocked, what needs attention

---

## Phase 4: SaaS / Multi-Tenancy (Future)

**Target:** After core system is proven for Yarn Digital

### Vision
Package the Agency OS as a subscription product for other agencies. Each agency gets the full platform without sharing resources.

### Each Tenant Gets:
- Their own dashboard instance (or org within shared platform)
- Their own CRM, task manager, agents, skills, client KB
- Isolated data (orgId-scoped, already built into architecture)
- Their own GitHub repos for skills & client docs

### BYOK — Bring Your Own Keys
- Agencies connect their own AI provider API keys (Anthropic, OpenAI, Google, etc.)
- Their own OpenClaw instance or compatible agent runner
- We never subsidise compute — platform fee only, AI costs are theirs
- API keys stored encrypted per-tenant

### Architecture Notes
- Current orgId-scoped Firestore design already supports multi-tenancy
- Subscription/billing via Stripe (already integrated)
- Onboarding flow: sign up → connect AI keys → create agents → import/create skills
- Admin panel for us to manage tenants

### Not Building Yet
This is documented for future reference. Priority is making it work brilliantly for Yarn Digital first, then productise.

---

## Existing Dashboard Features (Already Built)

These sections already exist and continue to work alongside the new features:

- **Dashboard home** — overview/stats
- **Projects** — client project management
- **Contacts** — client/prospect contacts
- **Leads** — lead tracking
- **Calendar** — scheduling
- **Settings** — app configuration

---

## Agent Team Roster

| Agent | Role | Emoji | Focus Areas |
|-------|------|-------|-------------|
| Aria | Content Strategist | ✍️ | Social media, copywriting, content calendars, brand voice |
| Scout | SEO Specialist | 🔍 | Keyword research, on-page SEO, competitor analysis, analytics |
| Bolt | Developer | ⚡ | Next.js, Firebase, Vercel, API integrations, bug fixes |
| Radar | Marketing Analyst | 📡 | Lead gen, market research, ad campaigns, performance tracking |

*Additional agents can be added as needs grow (e.g. Designer, Account Manager, Ad Specialist)*

---

## Technical Notes

- **Auth:** JWT-based, existing auth system carries through to new pages
- **Database:** Firebase Firestore — collections: `agents`, `tasks`, `learnings`, `skills-config`
- **Skills storage:** GitHub repo via GitHub API (not Firebase) — single source of truth
- **Deployment:** Vercel CLI (`vercel --prod`)
- **Git:** Local repo, push to yarn-digital/yd-dashboard when token refreshed

---

## Kanban Flow (Task Lifecycle)

```
Backlog → In Progress → Review → Done → Archived
                                   ↑
                          (Only Jonny moves here)
```

- **Backlog:** All new tasks land here
- **In Progress:** Agent is actively working on it
- **Review:** Work complete, awaiting Jonny's review
- **Done:** Jonny approved — only he moves tasks here
- **Archived:** Historical record

---

## Success Criteria

1. Jonny can see at a glance what every agent is working on
2. Tasks flow through the system without Jonny micromanaging
3. Skills improve over time through the feedback loop
4. Agents operate autonomously between conversations
5. Everything lives in one dashboard — no jumping between tools
