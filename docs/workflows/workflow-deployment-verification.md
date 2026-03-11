---
title: "Workflow: How to Verify a Deployment"
agent: Bolt
category: Workflows
tags: ["workflow", "deployment", "verification", "qa", "bolt"]
version: 1.0
updated: unknown
---

# Workflow: How to Verify a Deployment

## Purpose
This checklist is MANDATORY after every single deployment. No agent may claim something is "deployed", "live", "working", or "done" without completing every step.

**This exists because of real incidents where broken deployments were reported as "done".**

---

## THE CHECKLIST (All Steps Required)

### Step 1: Vercel Dashboard Check
1. Open Vercel deployment (or check via API)
2. Confirm status = **READY** (not BUILDING, not ERROR)
3. Read the **build logs** — look for:
   - TypeScript errors
   - Module not found errors
   - Environment variable warnings
   - Any error or warning text
4. Even if status says READY, **read the logs**. Some errors don't block the build.

### Step 2: Live URL Check
1. Load the production URL in a browser or via `web_fetch`
2. Confirm the page **actually renders** (not blank, not 500 error, not redirect loop)
3. Check the page content matches what was deployed (not a cached old version)
4. If there's a version indicator, confirm it shows the latest version

### Step 3: Critical Path Testing
1. Test the **primary user flow** — whatever the main action is (form submit, login, data display)
2. Test **navigation** — can you get to all main pages?
3. Test **API endpoints** — do they return data? Correct data?
4. Test on **mobile viewport** — does responsive layout work?

### Step 4: Error Check
1. Open browser developer tools → Console tab
2. Look for JavaScript errors (red text)
3. Look for failed network requests (red in Network tab)
4. Look for mixed content warnings (HTTP resources on HTTPS page)

### Step 5: Documentation
After ALL checks pass, document the result:
```
✅ Deployment Verified: {url}
Time: {timestamp}
- Vercel status: READY
- Build logs: clean (or note any warnings)
- Homepage: renders correctly
- Key flows: {list what was tested}
- API: responding correctly
- Mobile: verified
- Console: no errors
```

If ANY check fails:
```
❌ Deployment Issue: {url}
Time: {timestamp}
- Issue: {what's broken}
- Evidence: {error message, screenshot, log excerpt}
- Action: {what needs to be fixed}
```

---

## NEVER DO THIS
1. ❌ "It works locally so it should work in production" — VERIFY ON PRODUCTION
2. ❌ "The build succeeded so it's fine" — BUILD SUCCESS ≠ WORKING SITE
3. ❌ "I deployed it" (without checking) — DEPLOYED ≠ VERIFIED
4. ❌ Trust another agent's claim without verifying yourself
5. ❌ Skip mobile testing — mobile is where most users are

---

## Common Deployment Failures
1. **Missing env vars** — works locally (has .env.local), breaks in production
2. **Filesystem reads** — `fs.readFile` works locally, fails on Vercel serverless
3. **API route errors** — route compiles but throws runtime errors
4. **Client-side errors** — page renders server-side but crashes in browser
5. **CORS issues** — API works from same domain, fails from frontend

---

## When to Run This
- After EVERY deployment to production
- After EVERY deployment to staging/preview
- After EVERY configuration change (env vars, domain, redirects)
- When someone claims something is "deployed and working"
- During routine health checks
