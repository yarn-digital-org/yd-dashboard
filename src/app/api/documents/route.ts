import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  successResponse, 
  handleApiError,
  AuthUser
} from '@/lib/api-middleware';

// ============================================
// Types
// ============================================

interface Document {
  id: string;
  title: string;
  filename: string;
  agent: 'Scout' | 'Bolt' | 'Aria' | 'Radar';
  category: string;
  description: string;
  size: string;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  created: string;
  updated?: string;
  filePath: string;
  contentPreview?: string;
}

// ============================================
// Mock Data - Team Deliverables
// ============================================

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Yarn Digital SEO Audit',
    filename: 'yarn-digital-seo-audit.md',
    agent: 'Scout',
    category: 'SEO',
    description: 'Comprehensive website analysis with technical SEO assessment and priority action plan for yarndigital.co.uk growth',
    size: '9,007 bytes',
    status: 'completed',
    created: new Date('2026-03-10T05:45:00Z').toISOString(),
    filePath: '/documents/yarn-digital-seo-audit.md',
    contentPreview: `# Yarn Digital SEO Audit - March 2026

## Executive Summary
Comprehensive analysis of yarndigital.co.uk reveals strong technical foundation with key optimization opportunities.

## Key Findings
- ✅ Strong foundation: HTTPS, fast response (0.11s), Framer hosting
- ❌ Critical issue: Contact NAP info not crawlable - immediate fix needed
- ⚠️ Local SEO: Good Belfast targeting, opportunity for broader NI coverage  
- ⚠️ Content: Quality messaging but duplication issues need investigation
- ⚠️ Technical: Meta descriptions missing, Core Web Vitals testing needed

## Priority Actions
1. Fix contact page accessibility - implement structured data
2. Complete meta description audit across all pages
3. Optimize page speed and Core Web Vitals
4. Develop content expansion strategy for broader keyword coverage

## Impact Projection
Implementation of recommended fixes could drive 15-40% organic traffic growth within 6 months.

## Competitive Positioning
Analysis shows clear opportunities vs Belfast competitors in "digital agency Belfast" keyword gap.`
  },
  {
    id: '2',
    title: 'Belfast Competitor SEO Analysis',
    filename: 'belfast-competitor-seo-analysis.md',
    agent: 'Scout',
    category: 'Market Research',
    description: 'Market intelligence on 5 Belfast competitors with key growth opportunities identified',
    size: '12,785 bytes',
    status: 'completed',
    created: new Date('2026-03-10T05:50:00Z').toISOString(),
    filePath: '/documents/belfast-competitor-seo-analysis.md',
    contentPreview: `# Belfast Competitor SEO Analysis

## Competitive Landscape Overview
Analysis of 5 primary Belfast digital agencies reveals market positioning opportunities.

## Competitor Profiles

### Eyekiller (Primary Threat)
- **Experience:** 23+ years in market
- **Team Size:** 19+ staff members  
- **Client Base:** Enterprise focus
- **Strength:** Established brand recognition
- **Weakness:** Limited AI/modern tech positioning

### ProfileTree (AI Leader)
- **Focus:** AI integration, extensive content marketing
- **Strength:** Thought leadership in emerging tech
- **Weakness:** Less local Belfast focus
- **Opportunity:** Position against with "human + AI" approach

### Whitenoise (Premium Creative)
- **Clients:** BBC, Kainos (high-profile)
- **Positioning:** Premium creative agency
- **Weakness:** Higher price point may exclude SMEs

## Key Market Gaps
1. **"Digital agency Belfast"** - High-value keyword opportunity
2. **Content marketing scale** - Competitors posting 2-3x/week vs monthly
3. **Geographic expansion** - Derry, Lisburn, Dublin markets underserved
4. **SME positioning** - Gap between premium agencies and budget providers

## Strategic Recommendations
- Target 2x content output to match ProfileTree
- Develop "Belfast digital agency" keyword strategy
- Position as "AI-enhanced but human-centered"
- Capture SME market with transparent pricing`
  },
  {
    id: '3',
    title: 'Client Overview Template',
    filename: 'client-overview-template.md',
    agent: 'Aria',
    category: 'Templates',
    description: 'Standardized template for onboarding new clients with business info and project structure',
    size: '2,450 bytes',
    status: 'completed',
    created: new Date('2026-03-10T05:30:00Z').toISOString(),
    filePath: '/documents/client-overview-template.md',
    contentPreview: `# Client Overview Template

## Client Information
- **Company Name:** [Client Name]
- **Industry:** [Industry/Sector]
- **Website:** [Current Website URL]
- **Location:** [Primary Location]
- **Company Size:** [Employee Count/Revenue Band]

## Key Contacts
### Primary Contact
- **Name:** [Primary Contact Name]
- **Role:** [Job Title]
- **Email:** [Email Address]
- **Phone:** [Phone Number]
- **Best Contact Method:** [Email/Phone/Slack]

### Secondary Contacts
- **Name:** [Secondary Contact]
- **Role:** [Job Title]  
- **Responsibility:** [What they handle]

## Services Required
- [ ] Brand Strategy & Identity
- [ ] Website Design & Development
- [ ] SEO & Content Marketing
- [ ] Social Media Management
- [ ] Digital Advertising
- [ ] E-commerce Solutions
- [ ] Other: [Specify]

## Project Details
### Scope
[Detailed description of project scope and deliverables]

### Timeline
- **Project Start:** [Date]
- **Key Milestones:** [List major milestones]
- **Project Complete:** [Target completion date]

### Budget
- **Total Budget:** £[Amount]
- **Payment Terms:** [Payment schedule]
- **Additional Notes:** [Budget constraints, approval process]

## Brand Guidelines
### Visual Identity
- **Logo:** [Location of logo files]
- **Colors:** [Brand color palette]
- **Typography:** [Font choices]
- **Style:** [Brand personality/tone]

### Voice & Messaging
- **Tone:** [Brand voice description]
- **Key Messages:** [Core messaging points]
- **Target Audience:** [Primary audience profile]

## Technical Requirements
### Current Setup
- **Hosting:** [Current hosting provider]
- **CMS:** [Content management system]
- **Analytics:** [Tracking tools in use]
- **Email:** [Email platform]

### Integrations Needed
- [List required integrations]

## Success Metrics
### Primary KPIs
- [Key performance indicators]

### Reporting
- **Frequency:** [Weekly/Monthly reporting]
- **Format:** [Dashboard/Email/Meetings]

## Notes & Decisions
### Meeting Notes
[Record of key decisions and discussions]

### Change Requests  
[Track any scope changes or modifications]

## Project Files
### Design Files
- [Location of design assets]

### Development Files
- [Repository links, staging URLs]

### Content Assets
- [Copywriting, photography, video assets]

---
**Created:** [Date]  
**Last Updated:** [Date]  
**Project Manager:** [PM Name]`
  },
  {
    id: '4',
    title: '14-Day Social Content Calendar',
    filename: 'social-content-calendar-14days.md',
    agent: 'Aria',
    category: 'Marketing',
    description: '14-day social media content plan for Yarn Digital growth across LinkedIn, Instagram, and Facebook',
    size: '10,026 bytes',
    status: 'completed',
    created: new Date('2026-03-10T06:00:00Z').toISOString(),
    filePath: '/documents/social-content-calendar-14days.md',
    contentPreview: `# Yarn Digital 14-Day Social Content Calendar

## Content Strategy Overview
**Objective:** Drive engagement, showcase expertise, generate leads for Belfast SME market
**Platforms:** LinkedIn (primary), Instagram, Facebook  
**Posting Schedule:** 1x daily across platforms
**Content Mix:** 40% value/tips, 30% portfolio, 20% behind-scenes, 10% client results

## Week 1: March 10-16, 2026

### Day 1 (Monday) - Portfolio Showcase  
**Platform:** LinkedIn + Instagram  
**Content:** Case study carousel - "How we transformed [Client] website performance"
**Copy:** "🚀 From 3-second load times to under 1 second. Here's how we optimized [Client]'s website for both speed and conversions. Swipe to see the transformation ➡️"
**CTA:** "Need faster website performance? Let's chat 👇"
**Hashtags:** #WebDesign #Belfast #DigitalAgency #WebPerformance

### Day 2 (Tuesday) - Value/Tips
**Platform:** LinkedIn  
**Content:** Infographic - "5 SEO mistakes Belfast businesses make"
**Copy:** "❌ These 5 SEO mistakes are costing Belfast businesses valuable traffic. Are you making them too? (Check the comments for a free SEO checklist 📝)"
**CTA:** "Which mistake surprised you most?"
**Hashtags:** #SEO #BelfastBusiness #DigitalMarketing #SmallBusiness

### Day 3 (Wednesday) - Behind the Scenes
**Platform:** Instagram Stories + LinkedIn
**Content:** Team working session, AI tools in action  
**Copy:** "Wednesday workflow: Our team combining AI efficiency with human creativity. This is how we deliver faster without compromising quality ⚡"
**CTA:** "Curious about our process? Ask us anything!"
**Hashtags:** #TeamWork #AIAssisted #CreativeProcess #DesignThinking

### Day 4 (Thursday) - Client Results
**Platform:** LinkedIn  
**Content:** Before/after website traffic graph
**Copy:** "📈 6 months ago: 500 monthly visitors. Today: 2,100+ visitors. Here's what changed for this Belfast retailer's online presence..."
**CTA:** "Ready to grow your traffic? Book a free consultation"
**Hashtags:** #Results #GrowthMarketing #Belfast #DigitalTransformation`
  },
  {
    id: '5',
    title: 'Yarn Digital Brand Voice Guide',
    filename: 'brand-voice-guide.md',
    agent: 'Aria',
    category: 'Content',
    description: 'Comprehensive brand voice and tone guidelines for all Yarn Digital marketing materials and client communications',
    size: '3,720 bytes',
    status: 'completed',
    created: new Date('2026-03-10T06:05:00Z').toISOString(),
    filePath: '/documents/brand-voice-guide.md',
    contentPreview: `# Yarn Digital Brand Voice Guide

## Our Brand Personality
**Professional yet approachable** • **Results-focused** • **Belfast-rooted** • **Innovation-minded**

## Core Voice Principles

### 1. Direct & Clear
We communicate with clarity and purpose. No jargon, no fluff.
- ✅ "We'll increase your website traffic"
- ❌ "We'll leverage synergistic methodologies to optimize your digital presence"

### 2. Results-Focused  
Everything we say should connect to real business outcomes.
- ✅ "This change will drive more leads"
- ❌ "This looks really cool"

### 3. Belfast-Proud
We celebrate our Northern Ireland roots and local business community.
- ✅ "Supporting Belfast businesses to grow"
- ❌ Generic references that could be anywhere

### 4. Confidently Humble
We know our stuff, but we're not arrogant about it.
- ✅ "We've helped 50+ businesses grow"
- ❌ "We're the best agency in Belfast"

## Tone Variations by Context

### Client Communications
**Tone:** Professional, consultative, solution-oriented  
**Language:** Clear explanations, specific next steps, measurable outcomes  
**Example:** "Based on our analysis, implementing these 3 changes will improve your site speed by 40% and likely increase conversions by 15-20%."

### Social Media
**Tone:** Friendly, engaging, value-first  
**Language:** Conversational, emoji use encouraged, questions to drive engagement  
**Example:** "🚀 Quick tip: Your website should load in under 3 seconds. Anything slower and you're losing potential customers. How fast is yours? 👇"

### Sales/Proposals  
**Tone:** Confident, strategic, partnership-focused
**Language:** Business outcomes, ROI focus, collaborative approach
**Example:** "We don't just build websites – we create digital growth engines that drive measurable results for Belfast businesses."

## Do's and Don'ts

### ✅ DO
- Use "we" and "you" to create connection
- Include specific metrics and timeframes
- Reference Belfast/Northern Ireland context when relevant
- Show personality while maintaining professionalism  
- Focus on client success stories and outcomes
- Use active voice ("We delivered" not "Results were delivered")

### ❌ DON'T  
- Use industry jargon without explanation
- Make vague promises ("We'll make you successful")
- Compare negatively to competitors by name
- Over-use buzzwords (synergy, revolutionary, disruptive)
- Write in corporate speak that sounds generic
- Make claims we can't back up with data

## Word Choices
**Instead of "Solutions" → Use "Services" or be specific**  
**Instead of "Cutting-edge" → Use "Proven" or "Effective"**  
**Instead of "Passionate about" → Use "Focused on" or "Committed to"**  
**Instead of "Journey" → Use "Process" or "Experience"**

## Key Messages
1. "We design and build digital experiences that drive real business growth"
2. "Belfast-based agency helping local businesses compete online"  
3. "Combining creativity with data to deliver measurable results"
4. "Your success is our success – we grow when you grow"

---
**This guide applies to all external communications including:**
- Website copy and blogs
- Social media posts and responses  
- Client emails and proposals
- Marketing materials and presentations
- Press releases and media interactions`
  },
];

// ============================================
// GET - List documents with filtering
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  try {
    const { searchParams } = new URL(request.url);
    
    let filteredDocs = [...mockDocuments];
    
    // Apply filters
    const agent = searchParams.get('agent');
    if (agent && agent !== 'all' && ['Scout', 'Bolt', 'Aria', 'Radar'].includes(agent)) {
      filteredDocs = filteredDocs.filter(doc => doc.agent === agent);
    }
    
    const category = searchParams.get('category');
    if (category && category !== 'all') {
      filteredDocs = filteredDocs.filter(doc => 
        doc.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    const status = searchParams.get('status');
    if (status && status !== 'all' && ['draft', 'in-progress', 'completed', 'archived'].includes(status)) {
      filteredDocs = filteredDocs.filter(doc => doc.status === status);
    }
    
    const search = searchParams.get('search');
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocs = filteredDocs.filter(doc =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.filename.toLowerCase().includes(searchLower) ||
        doc.category.toLowerCase().includes(searchLower) ||
        doc.agent.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    const sort = searchParams.get('sort') || 'newest';
    switch (sort) {
      case 'newest':
        filteredDocs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        break;
      case 'oldest':
        filteredDocs.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
        break;
      case 'title-asc':
        filteredDocs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        filteredDocs.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'agent':
        filteredDocs.sort((a, b) => a.agent.localeCompare(b.agent));
        break;
      case 'category':
        filteredDocs.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'status':
        filteredDocs.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return successResponse({
      documents: filteredDocs,
      total: filteredDocs.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================
// Route Handler with Auth
// ============================================

export const GET = withAuth(handleGet);

// Export for other methods if needed in the future
export const POST = withAuth(async (request: NextRequest, context: any) => {
  return NextResponse.json({ error: 'Method not implemented yet' }, { status: 501 });
});

export const PUT = withAuth(async (request: NextRequest, context: any) => {
  return NextResponse.json({ error: 'Method not implemented yet' }, { status: 501 });
});

export const DELETE = withAuth(async (request: NextRequest, context: any) => {
  return NextResponse.json({ error: 'Method not implemented yet' }, { status: 501 });
});