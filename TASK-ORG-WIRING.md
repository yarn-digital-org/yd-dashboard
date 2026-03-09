# Task: Wire Org System Into All Routes

## Context
The yd-dashboard has a full org/members/roles system built (`/api/org/members`, `/api/roles`, `src/lib/rbac.ts`) but it's NOT wired into the core routes. Currently, API routes use `user.userId` as `orgId` — meaning each user is an island and can't see anyone else's data.

We need to make it so all users in the same org share data (tasks, agents, etc.).

## What Exists
- **Org system**: `organisations` collection, `org_members` collection, `roles` collection with permissions
- **RBAC**: `src/lib/rbac.ts` has `getOrgMembership()`, `hasPermission()`, `createDefaultRoles()`, etc.
- **Users have `orgId` field** (currently null for everyone)
- **13 existing tasks** all have `orgId` set to Jonny's userId (`7d227bb7-f40d-49ef-8425-b765e894cc21`)

## What Needs To Change

### 1. Create a helper: `resolveOrgId(user: AuthUser)`
In `src/lib/api-middleware.ts` or a new `src/lib/org-helpers.ts`:
- Looks up the user's `orgId` from their user doc in Firestore
- If user has an orgId, return it
- If not, fall back to `user.userId` (backwards compat for users not in an org yet)
- Cache per-request if possible

### 2. Update ALL routes that use `user.userId` as orgId
These files currently hardcode `user.userId` where they should use the user's org:

**Tasks:**
- `src/app/api/tasks/route.ts` — lines 59, 159: `.where('orgId', '==', user.userId)` and `orgId: user.userId`
- `src/app/api/tasks/[id]/route.ts` — lines 60, 88, 156: `task.orgId !== user.userId`

**Agents:**
- `src/app/api/agents/route.ts` — lines 45, 99
- `src/app/api/agents/[id]/route.ts` — lines 49, 77, 118

**Other:**
- `src/app/api/relationships/route.ts` — line 32
- `src/app/api/seed-phase2/route.ts` — lines 21, 27, 95, 147

For each: replace `user.userId` with the resolved orgId from the helper.

### 3. Update task assignment to support both agents AND users
The `assignedTo` field on tasks currently holds an agent ID (from the agents collection). It should also support assigning to user IDs (team members). The UI already has an agent picker — we may need to also populate it with org members.

Check `src/app/api/tasks/route.ts` createTaskSchema — `assignedTo` is already a plain string, so it can hold either an agent ID or user ID. The `assignedToName` field holds the display name. This should work as-is.

### 4. Do NOT change
- The org/members/roles routes themselves — they already work correctly
- Auth system — leave JWT and cookie auth alone
- Frontend — just fix the API layer

## Testing
After changes:
1. All existing functionality should still work for Jonny (his tasks should still appear)
2. When agents log in, they should see the same tasks as Jonny (once they're all in the same org)
3. Creating a task as any team member should be visible to all team members in the same org

## Important
- Keep changes minimal and surgical
- Don't break existing auth flow
- The helper should gracefully handle users without an orgId (fall back to userId)
