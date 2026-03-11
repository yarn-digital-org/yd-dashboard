---
title: "Workflow: How to Build & Deploy a Website"
agent: Bolt
category: Workflows
tags: ["workflow", "development", "deployment", "vercel", "nextjs", "bolt"]
version: 1.0
updated: unknown
---

# Workflow: How to Build & Deploy a Website

## Purpose
Standard development workflow for all web projects at Yarn Digital. Covers setup, coding standards, testing, deployment, and verification. Follow every step — no shortcuts.

---

## CRITICAL RULES (Non-negotiable)

1. **NEVER use filesystem reads on Vercel** — no `fs.readFile`, no `readdir`. Vercel is serverless. Use Firestore or external APIs for data.
2. **NEVER claim "done" without deploying AND verifying on production**
3. **NEVER commit secrets** — env vars only, never in code
4. **ALL repos stay PRIVATE** — no exceptions without Jonny's approval
5. **Run `npm run build` locally before pushing** — catch TypeScript errors early
6. **Test on the live URL after deployment** — not just locally

---

## Step 1: Project Setup

### 1.1 For Next.js Projects (DEFAULT for new builds)
```bash
npx create-next-app@latest {project-name} --typescript --tailwind --eslint --app --src-dir
cd {project-name}
```

### 1.2 Repository Setup
1. Create a PRIVATE GitHub repo under `yarn-digital` org
2. Initialize with README.md
3. Set up .gitignore (Node, Next.js)
4. Add .env.example with all required env vars (NO VALUES)
5. Push initial commit

### 1.3 Environment Variables
- All secrets go in `.env.local` (local dev)
- All production secrets go in Vercel Environment Variables
- NEVER hardcode secrets in source code
- Required format: `.env.example` with placeholder values

### 1.4 Standard Dependencies
```bash
# For Firebase projects
npm install firebase firebase-admin
# For styling
# Tailwind is included with create-next-app
# For testing
npm install -D vitest @testing-library/react
```

---

## Step 2: Development Standards

### 2.1 Code Style
- **TypeScript** — always. No `any` types unless absolutely unavoidable.
- **Functional components** — no class components in React
- **Server Components by default** — only use 'use client' when needed (interactivity, hooks, browser APIs)
- **Error boundaries** — wrap every page and major component
- **Loading states** — every async operation needs a loading indicator

### 2.2 File Structure (Next.js App Router)
```
src/
  app/
    layout.tsx        # Root layout
    page.tsx          # Homepage
    api/              # API routes
      {resource}/
        route.ts
    {page}/
      page.tsx
      loading.tsx
      error.tsx
  components/
    ui/               # Reusable UI components
    layout/           # Layout components (header, footer, nav)
    {feature}/        # Feature-specific components
  lib/
    firebase.ts       # Firebase client config
    firebase-admin.ts # Firebase admin config  
    utils.ts          # Utility functions
    api-middleware.ts  # API auth and helpers
  types/
    index.ts          # Shared TypeScript types
```

### 2.3 Data Rules
1. **Firestore for ALL data** — never local filesystem
2. **API routes for all mutations** — never direct Firestore writes from client
3. **Authentication on all API routes** — use `withAuth` middleware
4. **Input validation** — validate all inputs, never trust client data
5. **Error handling** — try/catch on every async operation, meaningful error messages

### 2.4 Performance Requirements
- **Lighthouse score**: 90+ on all categories (performance, accessibility, best practices, SEO)
- **Core Web Vitals**: LCP <2.5s, INP <200ms, CLS <0.1
- **Image optimization**: use next/image, appropriate sizes, WebP/AVIF
- **Font optimization**: use next/font, subset fonts
- **Bundle size**: monitor, lazy load non-critical components

---

## Step 3: Testing

### 3.1 Before Every Commit
```bash
npm run lint          # Fix any lint errors
npm run build         # Catch TypeScript and build errors
```

### 3.2 Before Every Deployment
1. Run full build locally
2. Test all pages/routes manually
3. Test on mobile viewport
4. Check all API endpoints return correct responses
5. Verify environment variables are set in Vercel

---

## Step 4: Deployment (Vercel)

### 4.1 Setup
1. Import project in Vercel dashboard
2. Set ALL environment variables in Vercel project settings
3. Configure build settings if non-standard
4. Set up custom domain if needed

### 4.2 Deploy
```bash
# Automatic: push to main branch
git push origin main

# Manual: use Vercel CLI
npx vercel --prod --token=$VERCEL_TOKEN
```

### 4.3 Post-Deployment Verification (MANDATORY)
This is NON-NEGOTIABLE. Every single deployment must complete ALL checks:

1. **Check Vercel dashboard** — confirm deployment status = READY
2. **Read build logs** — look for errors/warnings even if status is READY
3. **Load the live URL** — confirm the page renders (not blank, not error)
4. **Test critical user flows** — can users do the main thing the site does?
5. **Check API endpoints** — hit each endpoint, confirm responses
6. **Test on mobile** — responsive layout working?
7. **Check console for errors** — open browser dev tools, look at Console tab

### 4.4 Reporting
Only AFTER completing all verification steps:
```
✅ Deployed: {url}
- Build: READY, no errors
- Homepage: loads correctly
- API: all endpoints responding
- Mobile: verified
- Console: no errors
```

---

## Step 5: Ongoing Maintenance

### 5.1 Updates
- Keep dependencies updated monthly
- Monitor Vercel for failed deployments
- Watch error logs for runtime issues

### 5.2 Git Workflow
- `main` branch = production
- Feature branches for new work
- Pull requests for review before merging to main
- Meaningful commit messages (not "fix stuff")

---

## Common Mistakes to AVOID
1. ❌ Using `fs` (filesystem) for data in Vercel — IT DOESN'T EXIST IN PRODUCTION
2. ❌ Claiming "deployed" without checking the live URL
3. ❌ Committing .env files or secrets
4. ❌ Making repos public
5. ❌ Skipping TypeScript — catch bugs at build time, not runtime
6. ❌ No error handling — blank pages are worse than error messages
7. ❌ No loading states — users think the site is broken
8. ❌ Pushing to wrong repo — double-check before every push
9. ❌ Not running build locally first — broken deploys waste time
