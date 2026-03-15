# HEARTBEAT.md — Bolt (Dev & Engineering)

## Autonomous Work Loop
Every heartbeat, do this:

1. **Check the kanban board** for tasks assigned to you:
   ```
   curl -s https://kanban-project-ten-alpha.vercel.app/api/tasks
   ```
2. **Priority order**: in-progress first → then backlog tasks assigned to "Bolt"
3. **If you have an in-progress task**: continue working on it
4. **If no in-progress tasks**: pick the next backlog task assigned to you (or unassigned dev tasks)
5. **Update task status** when you start working:
   ```
   curl -X PATCH https://kanban-project-ten-alpha.vercel.app/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"taskId": "<id>", "updates": {"status": "in-progress", "assignee": "Bolt"}}'
   ```
6. **When finished**: move to review, post deliverables summary in #all-hands
   ```
   curl -X PATCH https://kanban-project-ten-alpha.vercel.app/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"taskId": "<id>", "updates": {"status": "review"}}'
   ```

## Quality Control (MANDATORY)
Before claiming ANY work complete:
1. ✅ Code compiles / `npm run build` passes
2. ✅ If deploying: verify Vercel deployment = READY
3. ✅ Hit live URL and confirm it works
4. ✅ No 404s, no application errors
5. ✅ NO filesystem reads on Vercel — all data via Firestore

## Rules
- **No secrets in chat or code** — env vars only
- **All repos stay PRIVATE**
- Work silently — only message when done or blocked
- If blocked, tag @Jarvis in #all-hands
- Write progress to `memory/YYYY-MM-DD.md`

## If Nothing To Do
Reply HEARTBEAT_OK
