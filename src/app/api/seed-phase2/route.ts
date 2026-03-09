import { NextRequest } from 'next/server';
import {
  withAuth,
  successResponse,
  requireDb,
  AuthUser,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';

async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const now = new Date().toISOString();

  // Check if already seeded
  const existingSkills = await db
    .collection(COLLECTIONS.SKILLS)
    .where('orgId', '==', user.userId)
    .limit(1)
    .get();

  const existingClients = await db
    .collection(COLLECTIONS.CLIENT_DOCS)
    .where('orgId', '==', user.userId)
    .limit(1)
    .get();

  const results: { skills: number; clients: number } = { skills: 0, clients: 0 };

  // Seed Skills
  if (existingSkills.empty) {
    const skills = [
      {
        name: 'Content Strategy',
        description: 'Developing content calendars, brand voice guidelines, and multi-platform content plans that drive engagement and conversions.',
        category: 'Content',
        content: '# Content Strategy\n\n## Overview\nContent strategy involves planning, creating, distributing, and managing content across all platforms.\n\n## Key Activities\n- Content calendar creation\n- Brand voice & tone guidelines\n- Platform-specific content adaptation\n- Performance analysis & iteration\n- SEO-integrated content planning\n\n## Tools\n- FeedHive for scheduling\n- Google Analytics for performance\n- Canva/Figma for visual content',
        tags: ['content', 'strategy', 'social-media', 'copywriting'],
        agentIds: [],
        source: 'internal',
      },
      {
        name: 'SEO Audit & Optimisation',
        description: 'Technical SEO audits, keyword research, on-page optimisation, and link building strategies for improved search visibility.',
        category: 'SEO',
        content: '# SEO Audit & Optimisation\n\n## Overview\nComprehensive SEO services to improve organic search rankings and drive qualified traffic.\n\n## Key Activities\n- Technical site audits (Core Web Vitals, crawlability, indexing)\n- Keyword research & mapping\n- On-page optimisation (meta tags, headers, content)\n- Local SEO (Google Business Profile)\n- Link building & digital PR\n- Monthly reporting & tracking\n\n## Tools\n- Google Search Console\n- Google Analytics\n- Screaming Frog\n- Ahrefs/SEMrush',
        tags: ['seo', 'audit', 'keywords', 'technical-seo', 'local-seo'],
        agentIds: [],
        source: 'internal',
      },
      {
        name: 'React/Next.js Development',
        description: 'Full-stack web application development using React, Next.js, TypeScript, and modern tooling.',
        category: 'Development',
        content: '# React/Next.js Development\n\n## Overview\nBuilding performant, accessible web applications using the React ecosystem.\n\n## Tech Stack\n- Next.js (App Router)\n- TypeScript\n- Tailwind CSS\n- Firebase / Supabase\n- Vercel deployment\n\n## Standards\n- Mobile-first responsive design\n- WCAG 2.1 AA accessibility\n- Core Web Vitals optimisation\n- CI/CD via GitHub Actions\n- Component-driven architecture',
        tags: ['react', 'nextjs', 'typescript', 'web-development', 'frontend'],
        agentIds: [],
        source: 'internal',
      },
      {
        name: 'Brand Design & Identity',
        description: 'Creating cohesive brand identities including logos, colour systems, typography, and brand guidelines.',
        category: 'Design',
        content: '# Brand Design & Identity\n\n## Overview\nDeveloping distinctive brand identities that resonate with target audiences.\n\n## Deliverables\n- Logo design (primary, secondary, favicon)\n- Colour palette (primary, secondary, accent)\n- Typography system\n- Brand guidelines document\n- Social media templates\n- Business card & stationery design\n\n## Process\n1. Discovery & research\n2. Mood boards & concepts\n3. Design development\n4. Refinement & feedback\n5. Final delivery & guidelines',
        tags: ['branding', 'design', 'logo', 'identity', 'guidelines'],
        agentIds: [],
        source: 'internal',
      },
      {
        name: 'Social Media Management',
        description: 'End-to-end social media management including content creation, scheduling, community management, and performance reporting.',
        category: 'Marketing',
        content: '# Social Media Management\n\n## Overview\nManaging social media presence across platforms to build brand awareness and drive engagement.\n\n## Platforms\n- Instagram\n- Facebook\n- LinkedIn\n- TikTok\n\n## Services\n- Content creation & curation\n- Scheduling via FeedHive\n- Community management & engagement\n- Paid social ad campaigns\n- Monthly analytics reports\n- Influencer outreach\n\n## Posting Cadence\n- Instagram: 4-5x/week\n- Facebook: 3-4x/week\n- LinkedIn: 2-3x/week\n- TikTok: 3-5x/week',
        tags: ['social-media', 'instagram', 'facebook', 'linkedin', 'tiktok'],
        agentIds: [],
        source: 'internal',
      },
      {
        name: 'Lead Generation & Nurturing',
        description: 'Intent-based lead generation, automated nurture sequences, and conversion optimisation strategies.',
        category: 'Marketing',
        content: '# Lead Generation & Nurturing\n\n## Overview\nIdentifying, capturing, and nurturing leads through automated and manual processes.\n\n## Channels\n- Reddit monitoring (Lead Radar)\n- LinkedIn outreach\n- Google Ads\n- Meta Ads\n- Referral programmes\n\n## Tools\n- Lead Radar (custom Reddit monitor)\n- Bloom.io CRM\n- Email automation\n- Landing page optimisation\n\n## Metrics\n- Cost per lead (CPL)\n- Lead-to-client conversion rate\n- Pipeline value\n- Time to close',
        tags: ['leads', 'generation', 'nurturing', 'conversion', 'crm'],
        agentIds: [],
        source: 'internal',
      },
    ];

    const batch = db.batch();
    for (const skill of skills) {
      const ref = db.collection(COLLECTIONS.SKILLS).doc();
      batch.set(ref, { ...skill, orgId: user.userId, createdAt: now, updatedAt: now });
    }
    await batch.commit();
    results.skills = skills.length;
  }

  // Seed Client Docs
  if (existingClients.empty) {
    const clients = [
      {
        clientName: 'YellowBear / MyClaimsOffer',
        industry: 'InsurTech',
        status: 'active',
        overview: '# YellowBear / MyClaimsOffer\n\n## Overview\nRevolutionary LiDAR-powered loss assessment platform. Three products: MyClaimsOffer web app, YellowBear native app, YellowBear marketing site.\n\n## Market\n- UK TAM: £89.6B\n- SOM target: £132.6M\n- No competitors on app stores — first mover advantage\n\n## Business Model\n- No Win No Fee, 10% of claim value\n- FCA regulated (Licence 951592)\n\n## Phases\n- **Phase 1 (Summer 2026)**: MyClaimsOffer — free home insurance claim valuation tool, captures leads, funnels high-value claims (>£12k) to YellowBear\n- **Phase 2 (Winter 2026/27)**: YellowBear App — AI damage recognition, automated cost calculation, direct insurer submission\n\n## Tech Partner\n- Sugar Rush (app development)',
        contacts: [
          { name: 'Ciaran', role: 'Founder', email: 'ciaran@yellowbear.app', phone: '+44 7703 719098' },
          { name: 'Deirdre', role: 'Co-Decision Maker', email: '', phone: '' },
        ],
        projects: [
          { name: 'MyClaimsOffer Web App', status: 'Planning', description: 'React/Next.js claim valuation tool — Phase 1 for Summer 2026' },
          { name: 'YellowBear Marketing Site', status: 'Scoped', description: 'Marketing website for YellowBear brand and app launch' },
          { name: 'Weather-Triggered Ad Campaigns', status: 'Planning', description: 'Pre/during/post storm ad campaigns. Target: 2 qualified referrals/day' },
        ],
        meetingNotes: '# Meeting Notes\n\n## Feb 2026 — Initial Project Review\n- Full project brief completed\n- 17 stakeholder questions identified for next meeting with Ciaran & Deirdre\n- Confirmed React/Next.js (NOT WordPress) for MyClaimsOffer\n- Marketing strategy: weather-triggered ad campaigns',
      },
      {
        clientName: 'Stonebridge Farm',
        industry: 'Agriculture / Food',
        status: 'active',
        overview: '# Stonebridge Farm\n\nLocal farm business requiring branding and web presence.',
        contacts: [],
        projects: [
          { name: 'Branding & Website', status: 'In Progress', description: 'Full brand identity and website build' },
        ],
        meetingNotes: '',
      },
      {
        clientName: 'Krumb Bakery',
        industry: 'Food & Beverage',
        status: 'active',
        overview: '# Krumb Bakery\n\nArtisan bakery requiring digital presence and social media strategy.',
        contacts: [],
        projects: [
          { name: 'Social Media & Brand', status: 'Active', description: 'Social media management and brand development' },
        ],
        meetingNotes: '',
      },
    ];

    const batch = db.batch();
    for (const client of clients) {
      const ref = db.collection(COLLECTIONS.CLIENT_DOCS).doc();
      batch.set(ref, { ...client, orgId: user.userId, createdAt: now, updatedAt: now });
    }
    await batch.commit();
    results.clients = clients.length;
  }

  return successResponse({
    message: 'Phase 2 seed complete',
    ...results,
    note: existingSkills.empty ? undefined : 'Skills already exist, skipped',
    clientNote: existingClients.empty ? undefined : 'Client docs already exist, skipped',
  });
}

export const POST = withAuth(handlePost);
