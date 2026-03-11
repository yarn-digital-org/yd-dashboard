---
title: "Workflow: How to Run an SEO Audit"
agent: Scout
category: Workflows
tags: ["workflow", "seo", "audit", "technical-seo", "scout"]
version: 1.0
updated: unknown
---

# Workflow: How to Run an SEO Audit

## Purpose
This document defines the exact step-by-step process for running a comprehensive SEO audit on any client website. Follow every step. Do not skip sections. The output must be a complete, actionable report.

---

## Prerequisites
- Client website URL
- Google Analytics access (if available)
- Google Search Console access (if available)
- Competitor URLs (minimum 3)

---

## Step 1: Technical SEO Analysis

### 1.1 Site Crawl
1. Use `web_fetch` to load the homepage and key pages
2. Check for:
   - **robots.txt** — fetch `{domain}/robots.txt`. Note any blocked paths
   - **sitemap.xml** — fetch `{domain}/sitemap.xml`. Confirm it exists, is valid XML, and lists all important pages
   - **HTTPS** — confirm the site loads on HTTPS. Check for mixed content warnings
   - **Canonical tags** — on each page, look for `<link rel="canonical">`. Flag missing or incorrect canonicals
   - **Redirect chains** — follow any 301/302 redirects. Flag chains longer than 2 hops

### 1.2 Page Speed
1. Run Google PageSpeed Insights: `https://pagespeed.web.dev/analysis?url={encoded_url}`
2. Record scores for both Mobile and Desktop
3. Note the top 3 "Opportunities" and "Diagnostics" from each
4. Key metrics to capture:
   - **LCP** (Largest Contentful Paint) — should be <2.5s
   - **FID/INP** (Interaction to Next Paint) — should be <200ms
   - **CLS** (Cumulative Layout Shift) — should be <0.1
   - **FCP** (First Contentful Paint) — should be <1.8s

### 1.3 Mobile Friendliness
1. Check viewport meta tag exists: `<meta name="viewport" content="width=device-width, initial-scale=1">`
2. Check text readability (font sizes, tap targets)
3. Check no horizontal scrolling issues
4. Note any mobile-specific issues

### 1.4 Structured Data
1. Check for JSON-LD schema markup on key pages
2. Required schemas by page type:
   - **Homepage**: Organization, LocalBusiness (if applicable)
   - **Service pages**: Service, FAQPage
   - **Blog posts**: Article, BreadcrumbList
   - **Contact page**: LocalBusiness, ContactPoint
3. Validate using: `https://search.google.com/test/rich-results?url={url}`

---

## Step 2: On-Page SEO Analysis

### 2.1 For EVERY key page, check:
1. **Title tag** — exists, unique, 50-60 characters, contains primary keyword
2. **Meta description** — exists, unique, 150-160 characters, contains CTA
3. **H1 tag** — exactly ONE per page, contains primary keyword
4. **H2-H6 hierarchy** — logical structure, keywords in subheadings
5. **Image alt text** — every image has descriptive alt text
6. **Internal links** — minimum 3 per page, using descriptive anchor text
7. **URL structure** — short, descriptive, uses hyphens, contains keyword

### 2.2 Content Quality
1. **Word count** — minimum 500 words for service pages, 1000+ for blog posts
2. **Keyword density** — primary keyword appears naturally 2-3 times per 500 words
3. **Readability** — short paragraphs, bullet points, scannable
4. **Uniqueness** — no duplicate content across pages
5. **Freshness** — note last updated date if visible

---

## Step 3: Off-Page SEO Analysis

### 3.1 Backlink Profile
1. Note domain authority if available
2. Check for toxic/spammy backlinks
3. Compare backlink count vs competitors
4. Identify link-building opportunities (directories, partnerships, PR)

### 3.2 Local SEO (if applicable)
1. **Google Business Profile** — search `{business name} {location}` on Google
   - Is it claimed and verified?
   - Is NAP (Name, Address, Phone) consistent?
   - Photos uploaded? Recent posts?
   - Reviews — how many? Average rating? Are they responding?
2. **Local directories** — check presence on:
   - Yelp, Bing Places, Apple Maps
   - Industry-specific directories
   - Local business directories
3. **NAP consistency** — same name, address, phone across ALL listings

---

## Step 4: Competitor Analysis

For each of the 3+ competitors:
1. Run the same technical checks (speed, mobile, schema)
2. Compare keyword rankings using web search
3. Identify keywords they rank for that the client doesn't
4. Note their content strategy (blog frequency, topics, depth)
5. Compare backlink profiles

---

## Step 5: Create the Deliverable

### Report Structure (MANDATORY FORMAT):
```
# SEO Audit Report — {Client Name}
Date: {YYYY-MM-DD}
Auditor: Scout

## Executive Summary
- Overall health score: X/100
- Critical issues: X
- Warnings: X  
- Opportunities: X

## Critical Issues (Fix Immediately)
{Numbered list with specific issue, affected URL, and exact fix}

## Warnings (Fix Within 30 Days)
{Numbered list with specific issue, affected URL, and exact fix}

## Opportunities (Strategic Improvements)
{Numbered list ranked by impact vs effort}

## Technical SEO Findings
{Detailed findings from Step 1}

## On-Page SEO Findings
{Detailed findings from Step 2}

## Off-Page SEO Findings
{Detailed findings from Step 3}

## Competitor Comparison
{Table or comparison from Step 4}

## Action Plan (Prioritized)
{Specific tasks, assigned priority, estimated effort}
```

### Quality Checklist Before Submission:
- [ ] Every finding has a specific URL reference
- [ ] Every issue has a specific, actionable fix (not vague advice)
- [ ] No placeholder or generic text — everything is specific to this client
- [ ] Competitor comparison includes actual data, not assumptions
- [ ] Action plan is prioritized by impact vs effort
- [ ] Report has been proofread for errors

---

## Common Mistakes to AVOID
1. ❌ Generic advice like "improve your SEO" — be SPECIFIC
2. ❌ Missing URLs — every finding must reference the exact page
3. ❌ No competitor data — always include the comparison
4. ❌ Skipping technical SEO — even if the site "looks fine"
5. ❌ Not checking mobile — always test mobile separately
6. ❌ Placeholder text — if you can't get real data, say so explicitly

---

## Tools Available
- `web_fetch` — load and analyze any URL
- `web_search` — search for competitor info, backlinks, rankings
- `browser` — for JavaScript-rendered pages and visual checks
- Google PageSpeed API (via web_fetch)
- Google Rich Results Test (via web_fetch)
