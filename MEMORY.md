# Long-Term Memory

## Setup
- Onboarded: 2026-03-09
- Part of Yarn Digital AI team (Aria, Bolt, Scout, Radar + Main CMO)
- Reports to Jonny, CEO & Founder
- Communicates via Slack

## Lessons Learned
_(Add lessons as you go — what worked, what didn't, what to remember)_

## Key Decisions
_(Record important decisions and their reasoning)_

### MANDATORY DEPLOYMENT QUALITY PROCEDURES (2026-03-10)

**NEVER claim "complete" or "ready" without FULL verification:**

**1. Local Build Verification**
- Run `npm run build` locally first
- Fix ALL TypeScript/build errors before pushing
- No exceptions or shortcuts allowed

**2. Live Deployment Verification**
- Check Vercel deployment logs for success
- Verify build completed without errors
- Test actual live URLs, not local versions

**3. End-to-End User Testing**
- Navigate live site as actual end user
- Test all functionality, buttons, links
- Verify no 404s or application errors
- Check authentication flows work properly

**4. Complete Feature Verification**
- API endpoints respond correctly
- Mobile responsiveness works
- All interactive elements function
- No broken or incomplete features

**5. Honest Status Reporting**
- ONLY report "complete" after full verification
- Report specific blockers when stuck
- Provide exact error messages when broken
- No optimistic or premature status updates

**REASON:** 2026-03-10 failure - claimed Documents page was ready when it had TypeScript errors, deployment failures, and broken functionality. Wasted Jonny's time and damaged credibility.

### DEPLOYMENT-READY API DEVELOPMENT (2026-03-10)

**NEVER use absolute server paths in APIs:**

**❌ WRONG (Server-only paths):**
```typescript
const deliverablesPath = '/root/.openclaw/workspace/deliverables';
```

**✅ CORRECT (Deployment-portable paths):**
```typescript  
const deliverablesPath = join(process.cwd(), 'data/deliverables');
```

**CRITICAL RULES:**
- **No hardcoded absolute paths** in any API route (`/root/...`, `/home/...`)
- **Use `process.cwd()` relative paths** for deployment portability
- **Files must exist in repo** - if API reads files, they must deploy with the build
- **Test locally with relative paths** that work in both dev and production

**PRE-DEPLOYMENT CHECKLIST:**
- [ ] No `/root/` or absolute paths in any API
- [ ] All file references use `join(process.cwd(), 'relative/path')`
- [ ] Required files are committed to the repository
- [ ] API works with production-like file structure

**CONSEQUENCE:** Working locally but broken on Vercel - exactly what happened twice

**ACCOUNTABILITY:** Trust must be rebuilt through consistent quality delivery.
