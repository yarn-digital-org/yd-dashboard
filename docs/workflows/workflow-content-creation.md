---
title: "Workflow: How to Create Social Media Content"
agent: Aria
category: Workflows
tags: ["workflow", "content", "social-media", "feedhive", "aria"]
version: 1.0
updated: unknown
---

# Workflow: How to Create Social Media Content

## Purpose
Step-by-step process for creating social media content from strategy through to scheduling. Covers content planning, copywriting, image generation, and FeedHive CSV output.

---

## Prerequisites
- Client brand voice guide (check Documents for existing one, or create using Brand Voice Workflow)
- Target platforms (Instagram, Facebook, LinkedIn, TikTok, Twitter/X)
- Content pillars/themes
- Posting schedule (frequency per platform per week)
- Client approval process understanding

---

## Step 1: Content Strategy & Planning

### 1.1 Define Content Pillars
Every client needs 4-6 content pillars. Examples for a service business:
1. **Educational** — tips, how-tos, industry insights (40%)
2. **Social proof** — testimonials, case studies, results (20%)
3. **Behind the scenes** — team, process, culture (15%)
4. **Promotional** — offers, CTAs, service highlights (15%)
5. **Community** — local events, partnerships, industry news (10%)

### 1.2 Content Calendar Structure
1. Determine posting frequency per platform:
   - Instagram: 3-5 posts/week + daily stories
   - Facebook: 3-4 posts/week
   - LinkedIn: 2-3 posts/week
   - Twitter/X: 5-7 posts/week
   - TikTok: 3-5 videos/week
2. Map content pillars across the week (don't stack same type)
3. Plan 2-4 weeks ahead minimum

---

## Step 2: Writing Posts

### 2.1 Platform-Specific Rules

**Instagram:**
- Lead with a hook (first line visible before "more")
- Use line breaks for readability
- 3-5 relevant hashtags (NOT 30 spam hashtags)
- Include a CTA in every post
- Emoji usage: moderate, on-brand
- Max 2200 characters

**Facebook:**
- Shorter than Instagram — 1-3 short paragraphs
- Questions drive engagement
- Links in post body (not comments)
- Minimal hashtags (0-2)
- Include a CTA

**LinkedIn:**
- Professional but not corporate
- Hook in first 2 lines (visible before "see more")
- Use line breaks and white space heavily
- 3-5 relevant hashtags at the end
- Long-form performs well (500-1300 characters)
- Include a CTA or question

**Twitter/X:**
- Max 280 characters (unless thread)
- Punchy, direct, conversational
- 1-2 hashtags max
- Threads for longer content (number each tweet)

### 2.2 Writing Quality Standards
1. **No generic filler** — "In today's fast-paced world..." is BANNED
2. **Specific > vague** — use real numbers, real examples, real results
3. **Brand voice** — check the client's brand voice guide. Match their tone.
4. **CTA in every post** — tell them what to do next
5. **Proofread** — no typos, no grammar errors, no wrong client name
6. **Emojis** — use as visual markers, not decoration. Match brand tone.
7. **Avoid AI-slop** — if it sounds like ChatGPT wrote it, rewrite it

### 2.3 Hashtag Strategy
1. Mix of sizes: 2 large (100K+), 2 medium (10K-100K), 1 niche (<10K)
2. Research hashtags via web search — check they're actually used
3. NO banned or problematic hashtags
4. Keep a running list per client of proven hashtags

---

## Step 3: Image Generation (if needed)

### 3.1 AI Image Creation with Flux/BFL
1. **NEVER generate without an approved concept** — get sign-off first
2. Write prompts following the 12-element system (see workflows/ai-image-prompting.md):
   - Subject, camera angle, wardrobe/styling, lighting, background
   - Colour grading, texture, style reference, negative guidance
   - Motion cues, aspect ratio, keyword tags
3. **Aspect ratios by platform:**
   - Instagram Feed: 1:1 (1080x1080) or 4:5 (1080x1350)
   - Instagram Stories/Reels: 9:16 (1080x1920)
   - Facebook: 1:1 or 16:9
   - LinkedIn: 1:1 or 1.91:1
   - Twitter: 16:9
4. Generate via BFL API using `BFL_API_KEY`
5. QA every image before using — check for AI artifacts, weird hands, warped text

### 3.2 Image Quality Checklist
- [ ] No AI artifacts or distortions
- [ ] Correct aspect ratio for target platform
- [ ] On-brand colours and style
- [ ] No copyrighted logos or recognizable faces (unless intended)
- [ ] File size appropriate for platform

---

## Step 4: Create FeedHive CSV

### 4.1 CSV Format (EXACT — do not deviate)
```csv
Text,Title,Media URLs,Labels,Social Medias,Scheduled
"Post copy here",,"https://image-url.jpg","Label1, Label2","My Facebook Page, Me on LinkedIn","2026-03-15T11:00:00.000Z"
```

### 4.2 Column Rules
1. **Text** — full post copy, quoted if contains commas
2. **Title** — optional (leave empty for most posts)
3. **Media URLs** — comma-separated within quotes. Must be publicly accessible URLs
4. **Labels** — comma-separated within quotes. Use for content pillar tracking
5. **Social Medias** — exact platform names from FeedHive (MUST MATCH EXACTLY)
6. **Scheduled** — ISO 8601 UTC timestamp

### 4.3 Scheduling Best Practices
- **Instagram**: Tue-Fri, 11am-1pm or 7-9pm local time
- **Facebook**: Tue-Thu, 9-11am local time
- **LinkedIn**: Tue-Wed, 8-10am or 12pm local time
- **Twitter**: Mon-Fri, 8-9am local time
- Avoid weekends unless engagement data supports it
- Space posts minimum 4 hours apart on same platform
- Never post to all platforms at exact same time

---

## Step 5: Upload to Google Drive

1. Create a Google Sheets file in the client's folder
2. Name format: `{Client Name} — Content Calendar {Month Year}`
3. Sheet 1: The content calendar with all posts
4. Sheet 2: Image URLs and descriptions
5. Share with client if needed for approval
6. Export as CSV for FeedHive upload

---

## Step 6: Quality Review

### Before Submission Checklist:
- [ ] Every post has a clear CTA
- [ ] Brand voice is consistent across all posts
- [ ] No two consecutive posts are the same content pillar
- [ ] All hashtags are researched and appropriate
- [ ] Image URLs are accessible and correct aspect ratio
- [ ] Scheduling times are optimal for each platform
- [ ] CSV format is exactly correct for FeedHive
- [ ] No typos or grammar errors
- [ ] Client name is correct (triple-check — wrong client name is unacceptable)
- [ ] No AI-sounding generic text

---

## Common Mistakes to AVOID
1. ❌ Generic, soul-less copy that sounds like every other AI post
2. ❌ Same post copied across platforms without adapting format
3. ❌ Too many hashtags on LinkedIn/Facebook (keep it minimal)
4. ❌ Posting at bad times (3am, Sunday morning)
5. ❌ Wrong CSV format — FeedHive import will fail
6. ❌ Missing CTAs — every post needs a next step
7. ❌ Using images without QA — AI artifacts destroy credibility
8. ❌ Ignoring the brand voice guide — check it every time
