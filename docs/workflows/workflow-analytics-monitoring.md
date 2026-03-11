---
title: "Workflow: How to Monitor & Report Analytics"
agent: Radar
category: Workflows
tags: ["workflow", "analytics", "monitoring", "reporting", "radar"]
version: 1.0
updated: unknown
---

# Workflow: How to Monitor & Report Analytics

## Purpose
Standard process for monitoring website analytics, tracking performance KPIs, and creating client-ready reports. Covers daily monitoring, weekly reports, and monthly deep-dives.

---

## Prerequisites
- Google Analytics 4 access for the client site
- Google Search Console access (if available)
- Baseline metrics established (use the Analytics Baseline document as reference)
- KPI targets defined with client

---

## Step 1: Daily Monitoring

### 1.1 Quick Health Check (5 minutes)
Run these checks daily:
1. **Traffic anomalies** — is traffic significantly up or down vs. same day last week?
2. **Error pages** — any spike in 404s or server errors?
3. **Top landing pages** — any changes in what's driving traffic?
4. **Conversion tracking** — are goals still firing? Any drops?

### 1.2 Alert Thresholds
Flag immediately if:
- Traffic drops >30% day-over-day
- Conversion rate drops >50%
- New high-traffic page appears (could be spam/bot traffic)
- Site goes down (monitor via uptime check)

---

## Step 2: Weekly Report

### 2.1 Metrics to Track
| Metric | Where to Find | What "Good" Looks Like |
|--------|--------------|----------------------|
| Total sessions | GA4 Overview | Trending up week-over-week |
| Unique users | GA4 Overview | Trending up |
| Bounce rate | GA4 Engagement | <50% for service sites |
| Avg session duration | GA4 Engagement | >2 minutes |
| Pages per session | GA4 Engagement | >2.5 |
| Top 10 landing pages | GA4 Pages | Key service pages ranking high |
| Traffic sources | GA4 Acquisition | Organic growing, diversified |
| Goal completions | GA4 Conversions | Meeting weekly targets |
| Top search queries | Search Console | Brand + service keywords |
| Average position | Search Console | Improving for target keywords |

### 2.2 Weekly Report Format
```
# Weekly Analytics Report — {Client Name}
Week of: {date range}

## Summary
- Sessions: {X} ({+/-X%} vs last week)
- Users: {X} ({+/-X%})
- Conversions: {X} ({+/-X%})
- Top traffic source: {source}

## Key Changes
{3-5 bullet points on notable changes}

## Top Performing Content
1. {Page} — {sessions} sessions, {conversion} conversion rate
2. ...

## SEO Performance
- Impressions: {X}
- Clicks: {X}
- Avg Position: {X}
- Top queries: {list}

## Recommendations
{2-3 specific actions based on this week's data}
```

---

## Step 3: Monthly Deep-Dive

### 3.1 Comprehensive Analysis
1. **Month-over-month trends** — all key metrics compared
2. **Year-over-year** — if data available, compare to same month last year
3. **Traffic source breakdown** — organic, paid, social, direct, referral percentages
4. **Content performance** — which blog posts/pages are driving results?
5. **Conversion funnel** — where are users dropping off?
6. **Device breakdown** — mobile vs desktop trends
7. **Geographic data** — where is traffic coming from?
8. **Page speed trends** — are Core Web Vitals improving?

### 3.2 Competitor Benchmark
1. Compare traffic estimates with competitors
2. Compare keyword ranking positions
3. Note any competitive changes (new competitor content, ads)

### 3.3 Monthly Report Format
```
# Monthly Analytics Report — {Client Name}
Period: {Month Year}

## Executive Summary
{5-7 sentences: overall performance, highlights, concerns}

## Performance Dashboard
{All KPIs with month-over-month and trend arrows}

## Traffic Analysis
{Source breakdown, geographic, device data}

## Content Performance
{Top 10 pages, new vs returning visitors}

## SEO Report
{Rankings, visibility, keyword movement}

## Conversion Analysis
{Goal completions, funnel analysis, conversion rate by source}

## Competitor Movement
{Any notable competitive changes}

## Next Month Priorities
{3-5 specific recommendations with expected impact}

## Appendix
{Raw data tables for reference}
```

---

## Step 4: Quality Standards

### Data Accuracy
- [ ] All numbers pulled from GA4/Search Console (never estimated or made up)
- [ ] Date ranges are correct and consistent
- [ ] Comparison periods are like-for-like (same number of days)
- [ ] Percentages are calculated correctly
- [ ] No data from test/staging environments mixed in

### Report Quality
- [ ] Every number has context (is it good or bad? Up or down?)
- [ ] Recommendations are specific and actionable
- [ ] No jargon without explanation (clients may not know "CTR" or "CLS")
- [ ] Charts/tables are clear and labelled
- [ ] Report is proofread

---

## Common Mistakes to AVOID
1. ❌ Reporting raw numbers without context — "500 sessions" means nothing without comparison
2. ❌ Making up data — if you can't access it, say so. NEVER fabricate numbers.
3. ❌ Vanity metrics only — impressions without conversions is a feel-good report
4. ❌ No recommendations — data without action is just a spreadsheet
5. ❌ Wrong date ranges — always double-check your time periods
6. ❌ Ignoring mobile — mobile traffic is often 60%+ and behaves differently
7. ❌ Not explaining WHY — "traffic dropped 20%" is useless without investigating the cause
