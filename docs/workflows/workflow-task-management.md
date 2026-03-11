---
title: "Workflow: How to Use the Kanban Board & Manage Tasks"
agent: Bolt
category: Workflows
tags: ["workflow", "kanban", "tasks", "project-management", "bolt"]
version: 1.0
updated: unknown
---

# Workflow: How to Use the Kanban Board & Manage Tasks

## Purpose
The kanban board at yd-dashboard.vercel.app is the single source of truth for all work. If it's not on the board, it doesn't exist. Follow this process for all task management.

---

## CRITICAL RULES

1. **The board must ALWAYS reflect reality** — if you're working on something, it's "in-progress". If deliverables are posted, it's "review".
2. **ONLY Jonny moves tasks to "done" or "archived"** — agents cannot close their own tasks
3. **Pull from the backlog** — don't wait to be told. Check the board, pick up work.
4. **Update the board as you work** — stale boards look like nothing's happening

---

## Task Flow

```
backlog → in-progress → review → done → archived
   ↑                        |
   └── rejected/needs-work ←┘
```

---

## Step 1: Creating Tasks

### 1.1 Task Format
Every task needs:
- **Title** — clear, specific, action-oriented (e.g., "Run SEO audit for Stonebridge Farm" not "SEO stuff")
- **Description** — what needs to be done, acceptance criteria, any context
- **Assigned agent** — who's responsible (Scout, Bolt, Aria, Radar)
- **Priority** — high, medium, low
- **Category/tags** — for filtering and tracking
- **Due date** — if there's a deadline

### 1.2 Good vs Bad Task Titles
✅ "Create 14-day content calendar for Krumb Bakery Instagram"
❌ "Content calendar"

✅ "Fix mobile navigation overlap on yarndigital.co.uk homepage"
❌ "Fix bug"

✅ "Run competitor SEO analysis for Belfast agency market"
❌ "Research competitors"

---

## Step 2: Working on Tasks

### 2.1 Picking Up Work
1. Check the backlog for tasks assigned to you
2. If nothing assigned, check for unassigned tasks you can handle
3. Move task to "in-progress" BEFORE starting work
4. Only work on 1-2 tasks at a time — finish before starting new ones

### 2.2 While Working
1. Keep notes on progress in the task comments
2. If blocked, add a comment explaining the blocker and flag to Jarvis
3. If scope changes, update the task description
4. If it's taking longer than expected, add a comment with revised estimate

### 2.3 Completing Work
1. Produce the deliverable (document, code, report, etc.)
2. Store deliverable in the appropriate location (Dashboard Documents, GitHub, Drive)
3. Update the task with a link to the deliverable
4. Move task to "review"
5. Notify Jarvis that work is ready for review

---

## Step 3: Review Process

### 3.1 Jarvis Reviews
1. Check deliverable quality against the relevant workflow document
2. Verify all checklist items from the workflow are met
3. If quality is good → leave in "review" for Jonny's final check
4. If issues found → move back to "in-progress" with specific feedback

### 3.2 Quality Standards
Every deliverable must:
- [ ] Follow the relevant workflow document step-by-step
- [ ] Contain no placeholder or generic content
- [ ] Be specific to the client/task (not one-size-fits-all)
- [ ] Be proofread for errors
- [ ] Include all required sections from the workflow template

---

## Step 4: Task API Reference

### 4.1 API Endpoints
```
Base URL: https://yd-dashboard.vercel.app/api/tasks

GET    /api/tasks              — List all tasks (with filters)
GET    /api/tasks?status=backlog — Filter by status
POST   /api/tasks              — Create new task
PATCH  /api/tasks/{id}         — Update task
DELETE /api/tasks/{id}         — Delete task
```

### 4.2 Task Statuses
- `backlog` — waiting to be picked up
- `in-progress` — actively being worked on
- `review` — work complete, awaiting review
- `done` — approved by Jonny
- `archived` — completed and filed

---

## Common Mistakes to AVOID
1. ❌ Working without updating the board — invisible work doesn't count
2. ❌ Moving tasks to "done" yourself — only Jonny does this
3. ❌ Vague task descriptions — be specific about what "done" looks like
4. ❌ Too many tasks in-progress — finish what you started
5. ❌ Not linking deliverables — the task should point to the output
6. ❌ Stale board — update as you go, not once a week
