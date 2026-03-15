# SOP: Check Credentials Before Claiming No Access

**Status:** MANDATORY — all agents must follow this  
**Created:** 2026-03-13  
**Reason:** Jonny has repeatedly had to remind us that credentials exist in .env and TOOLS.md. This wastes his time and makes us look incompetent.

---

## Rule

**NEVER tell Jonny (or anyone) that you "don't have access" to a tool or service without first checking ALL of the following:**

### Pre-Claim Checklist

1. **Check `.env` file** in your workspace AND the main workspace (`/root/.openclaw/workspace/.env`)
   ```bash
   grep -i "<service_name>" /root/.openclaw/workspace/.env
   grep -i "<service_name>" .env
   ```

2. **Check `TOOLS.md`** in your workspace AND the main workspace
   ```bash
   cat /root/.openclaw/workspace/TOOLS.md
   cat TOOLS.md
   ```

3. **Check `MEMORY.md`** for notes about the service (access setup, token rotation, known issues)

4. **Check `memory/` daily files** for recent credential changes or token refreshes

5. **Check skill files** — there may be a skill with built-in auth instructions
   ```bash
   ls /root/.openclaw/workspace/skills/ | grep -i "<service_name>"
   ```

6. **Check config files** in `~/.config/` — tools like gws, gog store credentials there

7. **Try the API/tool** — sometimes it just works. Don't assume it won't.

### If Tokens Are Expired

1. Check if there's a refresh token in `.env` — try refreshing before escalating
2. Check `MEMORY.md` for refresh instructions (client IDs, endpoints, etc.)
3. Only escalate to Jarvis/Jonny AFTER confirming the token can't be refreshed

### If You Genuinely Don't Have Access

1. State what you checked (list the files)
2. State the specific error you got
3. Ask for access with the minimum info needed (e.g. "need API key for X, goes in .env as X_API_KEY")

---

## Services We Have Access To (Reference)

| Service | Env Var(s) | Location |
|---------|-----------|----------|
| Canva Connect API | `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_ACCESS_TOKEN`, `CANVA_REFRESH_TOKEN` | `.env` |
| Google Workspace (Gmail, Calendar, Drive) | OAuth tokens | `~/.config/gws/credentials*.json` |
| Vercel | `VERCEL_TOKEN` in deploy commands | MEMORY.md |
| GitHub | PAT in git remote URLs | repo `.git/config` |
| Firebase | Firestore config | project configs |
| FeedHive | `FEEDHIVE_API_KEY` | `.env` |
| Flux (BFL) | `BFL_API_KEY` | `.env` |
| Runway | `RUNWAY_API_KEY` | `.env` |
| LTX Video | `LTX_API_KEY` | `.env` |
| Meta/Facebook | `META_ACCESS_TOKEN`, `META_APP_ID`, `META_APP_SECRET` | `.env` |

---

## Consequences of Not Following This SOP

- Jonny loses trust in the team
- We look incompetent
- Jonny has to repeat himself (he hates this)
- Tasks get delayed for no reason

**Bottom line: CHECK FIRST, ASK SECOND.**
