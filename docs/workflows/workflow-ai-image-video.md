---
title: "Workflow: How to Generate AI Images & Videos"
agent: Aria
category: Workflows
tags: ["workflow", "ai", "image", "video", "flux", "runway", "ltx", "aria"]
version: 1.0
updated: unknown
---

# Workflow: How to Generate AI Images & Videos

## Purpose
Standard process for generating AI images and videos for client content. Covers concept approval, detailed prompting, quality assurance, and the full production pipeline.

---

## CRITICAL RULES (Non-negotiable)

1. **NEVER generate without an approved concept** — get sign-off from Jonny first
2. **NEVER use vague prompts** — every prompt must be a professional photography brief
3. **ALWAYS QA before delivering** — check for AI artifacts, warped objects, weird hands
4. **Rigid objects (phones, products) DON'T WORK well** — use different strategies for product shots
5. **Track costs** — every generation costs money. Don't iterate blindly.

---

## Step 1: Concept Development

### 1.1 Before ANY Generation
1. Define the PURPOSE — what is this image/video for? (social post, website hero, ad creative)
2. Define the MESSAGE — what should the viewer feel/think/do?
3. Define the AUDIENCE — who will see this?
4. Define the PLATFORM — determines aspect ratio and style
5. Define the STYLE — reference real photography/cinematography styles

### 1.2 Concept Document Format
```
## Image/Video Concept

**Purpose:** {What it's for}
**Message:** {What it communicates}
**Platform:** {Where it will be used}
**Aspect Ratio:** {9:16 / 1:1 / 16:9 / 4:5}
**Style Reference:** {Real-world reference — photographer, film, commercial}
**Description:** {Plain English description of the desired result}
```

### 1.3 Get Approval
- Present concept to Jonny BEFORE generating
- Wait for explicit approval
- If changes requested, update concept and re-present
- ONLY proceed to generation after "approved" or "go ahead"

---

## Step 2: Image Generation (Flux/BFL)

### 2.1 The 12-Element Prompt System
EVERY image prompt must include ALL 12 elements:

1. **Subject** — who/what is in the frame (specific: age, build, expression, action)
2. **Camera** — angle, lens, distance (e.g., "85mm f/1.4, shot from low angle, medium close-up")
3. **Wardrobe/Styling** — clothing, accessories, hair, makeup details
4. **Lighting** — type, direction, quality (e.g., "golden hour side light, soft fill from left")
5. **Background** — specific environment, depth, elements
6. **Colour Grading** — palette, mood (e.g., "warm orange and teal grade, lifted blacks")
7. **Texture** — surface quality, grain, finish (e.g., "subtle film grain, high detail skin texture")
8. **Style Reference** — photographer, publication, campaign (e.g., "shot for Nike by Travis Scott")
9. **Negative Guidance** — what to avoid (e.g., "no text, no logos, no blurry edges")
10. **Motion Cues** — implied movement if needed (e.g., "hair caught mid-movement")
11. **Aspect Ratio** — exact dimensions for the platform
12. **Keyword Tags** — style keywords (e.g., "editorial, high fashion, sports photography")

### 2.2 Prompt Template
```
[Subject description with specific details]. [Camera angle and lens]. 
[Wardrobe and styling details]. [Lighting setup]. [Background and environment]. 
[Colour grading and mood]. [Texture and finish quality]. 
Shot in the style of [reference photographer/brand/campaign]. 
[Motion or action cues]. [Aspect ratio].
Negative: [what to avoid].
Tags: [style keywords]
```

### 2.3 API Call (BFL/Flux)
- API key: stored as `BFL_API_KEY` in env
- Use Flux Pro for final outputs, Flux Schnell for quick tests
- Always save prompts alongside generated images for reference

### 2.4 Image QA Checklist
- [ ] No distorted faces or hands
- [ ] No AI artifacts (floating objects, melted textures)
- [ ] No unintended text or symbols
- [ ] Correct aspect ratio
- [ ] Colours match the brief
- [ ] Overall quality is professional grade
- [ ] Would a real photographer's portfolio include this? If not, regenerate.

---

## Step 3: Video Generation

### 3.1 Available Tools

**Runway (Image-to-Video)**
- Best for: cinematic camera movements, slow-motion, atmospheric
- Limitations: warps rigid objects, expensive
- API key: `RUNWAY_API_KEY`
- Input: high-quality still image → 4-second video clip

**LTX-2 (Text-to-Video / Image-to-Video)**
- Best for: cost-effective, native 4K, built-in audio
- Models: ltx-2-fast (cheap drafts) and ltx-2-pro (final quality)
- API key: `LTX_API_KEY`
- Full docs: `workflows/ltx-video-api.md`

### 3.2 Video Pipeline
1. **Start with a Flux image** — get the still frame perfect first
2. **QA the image** — if the image isn't right, the video won't be either
3. **Write a motion brief** — describe camera movement and action:
   - Camera: "slow push in" / "orbit right" / "static with parallax"
   - Subject: "turns head slowly" / "hair blowing in wind" / "walks forward"
   - Environment: "leaves drifting" / "light rays shifting" / "subtle background movement"
4. **Generate with appropriate tool:**
   - Quick test → LTX-2 fast
   - Final quality → LTX-2 pro or Runway
5. **QA the video** — watch frame by frame for:
   - Warping or morphing
   - Unnatural movement
   - Flickering or artifacts
   - Smooth loop potential (if needed)

### 3.3 Video QA Checklist
- [ ] Movement is natural and purposeful
- [ ] No warping of faces, hands, or rigid objects
- [ ] No flickering or temporal artifacts
- [ ] Camera movement is smooth
- [ ] Duration appropriate for platform
- [ ] Audio (if included) matches the visual mood

---

## Step 4: Delivery

### 4.1 File Naming Convention
```
{client}_{platform}_{type}_{date}_{version}.{ext}
Example: yarn_instagram_hero_20260311_v1.png
Example: yarn_tiktok_reel_20260311_v2.mp4
```

### 4.2 Delivery Package
1. Final image/video file(s)
2. Prompt used (for future reference/iteration)
3. Concept brief (for context)
4. Upload to client's Google Drive folder

### 4.3 Post-Generation Notes
- Jonny adds voiceover, music, and text overlays in his editing software
- Provide clean files (no text burned in unless specifically requested)
- Note any limitations or things to watch for

---

## Common Mistakes to AVOID
1. ❌ Generating without concept approval — wastes money and time
2. ❌ Vague prompts ("a person in a city") — results will be generic garbage
3. ❌ Not QA-ing outputs — AI artifacts in client deliverables is unacceptable
4. ❌ Trying product shots with Runway — rigid objects warp. Use static images or different tools.
5. ❌ Iterating blindly — if the first 3 attempts aren't working, change strategy, don't burn more credits
6. ❌ Forgetting aspect ratios — wrong size = unusable
7. ❌ Not saving prompts — you'll want to recreate similar styles later
