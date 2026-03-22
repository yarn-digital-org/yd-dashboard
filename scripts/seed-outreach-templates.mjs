// Seed outreach templates into Firestore
// Run: node scripts/seed-outreach-templates.mjs
import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Read service account directly from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const saMatch = envContent.match(/FIREBASE_SERVICE_ACCOUNT=(.+)/);
if (!saMatch) throw new Error('FIREBASE_SERVICE_ACCOUNT not found in .env.local');
const serviceAccount = JSON.parse(saMatch[1].trim());

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function getUserId() {
  // Try jonny@yarndigital.co.uk first
  for (const email of ['jonny@yarndigital.co.uk', 'bolt@yarndigital.co.uk']) {
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!snap.empty) {
      console.log(`Found user: ${email} → ${snap.docs[0].id}`);
      return snap.docs[0].id;
    }
  }
  // List first users to see what's there
  const all = await db.collection('users').limit(5).get();
  console.log('Users in DB:', all.docs.map(d => ({ id: d.id, email: d.data().email })));
  throw new Error('Cannot find user — check the emails above and update the script');
}

const now = new Date().toISOString();

const templates = [
  {
    sector: 'Accountancy',
    channel: 'email',
    subject: "Your digital presence isn't earning its keep",
    body: `Hi [Name],

[Firm name] clearly has strong credentials — but your website isn't doing that story justice. Most independent accountancy practices in NI are invisible on Google for the searches their next client is already doing: "accountant Belfast," "small business accountant NI," "self-assessment help Belfast."

I'm Jonny from Yarn Digital. We build websites and digital presence for professional services firms across Northern Ireland — clean, fast, conversion-focused. We recently helped a Belfast advisory firm go from zero inbound enquiries to being approached by two mid-size companies within 6 weeks of launch.

Worth a 20-minute call to see if there's something similar we could do for [Firm name]?

Jonny
Yarn Digital — Design, Build, Grow
yarndigital.co.uk | jonny@yarndigital.co.uk`,
    tailoredServices: `Professional, conversion-focused website redesign\nLocal SEO for "accountant [city]" and service-specific terms\nClient intake automation (replace PDF forms with smart online flows)\nGoogle Business Profile optimisation\nCase study / testimonials page to build credibility`,
  },
  {
    sector: 'Solicitors',
    channel: 'email',
    subject: "[Firm name]'s digital presence — a quick observation",
    body: `Hi [Name],

[Firm name] has a strong reputation in Belfast [practice area] — but your website is doing less work than your team is.

When a potential client Googles a Belfast solicitor, they're making a snap decision in about 8 seconds. The firms winning that moment aren't necessarily the best firms — they're the ones with the clearest, most credible online presence. Most NI solicitor sites are text-heavy, have no clear CTA, and haven't been updated since 2018.

I'm Jonny from Yarn Digital. We specialise in brand and web for professional services firms across Northern Ireland. We've helped similar-sized firms go from invisible online to being the obvious first choice in their niche.

Would a 20-minute call be worth your time?

Jonny
Yarn Digital | yarndigital.co.uk`,
    tailoredServices: `Modern, authoritative website that reflects the weight of the firm\nPractice area landing pages optimised for local search\nClear client journey: visit → enquire → instruct\nTeam profiles that build trust before the first call\nAI-powered client intake form automation`,
  },
  {
    sector: 'Physio/Sports Rehab',
    channel: 'email',
    subject: "Your website isn't keeping up with your clinic",
    body: `Hi [Name],

[Clinic name] runs a serious operation — but your website isn't reflecting that, and it's costing you direct bookings.

Most independent physio clinics in NI are sending patients to Doctify or Healthcode for every booking — paying commission each time. A modern website with integrated online booking means patients book directly with you. It pays for itself within 2 months in most cases.

I'm Jonny from Yarn Digital. We build websites for health and sports clinics across NI — clean, professional, and built around direct bookings rather than platform dependency.

Worth a quick call? Happy to show you some examples.

Jonny
Yarn Digital | yarndigital.co.uk`,
    tailoredServices: `Modern clinic website with integrated online booking (no more Doctify commission)\nLocal SEO for "physio [city]" and condition-specific terms\nTeam page and credentials section to build referrer confidence\nPatient intake form automation\nGoogle Business Profile setup and optimisation`,
  },
  {
    sector: 'Construction/Trades',
    channel: 'email',
    subject: "Your competitors are winning contracts from Google. You're not.",
    body: `Hi [Name],

[Company name] clearly does quality work — but your digital presence isn't winning you new contracts. Most Belfast builders and contractors are invisible online for searches like "commercial fit-out Belfast," "extensions NI," "building contractors Belfast." The firms showing up in those results are winning leads you should be getting.

I'm Jonny from Yarn Digital. We build portfolio-focused websites for NI contractors that generate real enquiries — showcasing your work, targeting the right search terms, and converting visitors into quote requests.

15 minutes on a call?

Jonny
Yarn Digital | yarndigital.co.uk`,
    tailoredServices: `Portfolio and project showcase website\nLocal SEO for trade and project-type search terms\nQuote request automation\nGoogle Business Profile and Maps optimisation\nCase studies with before/after project photos`,
  },
  {
    sector: 'Retail',
    channel: 'instagram',
    subject: 'Your store is open 6 days a week. Your website should be selling 24/7.',
    body: `Hi [Name],

[Store name] clearly has a loyal following — but your website isn't working as hard as your physical store. Many great Belfast independents have an Instagram presence that far outperforms their web presence, which means you're invisible to anyone who doesn't already follow you.

I'm Jonny from Yarn Digital. We build Shopify stores and websites for independent Belfast retailers — fast, clean, and set up to actually sell.

Happy to show you some examples of what we've done for similar businesses.

Jonny
Yarn Digital | yarndigital.co.uk`,
    tailoredServices: `Shopify store build or refresh\nProduct SEO and category page optimisation\nGoogle Shopping setup\nInstagram Shop integration\nLocal "find us" page for footfall alongside online sales`,
  },
  {
    sector: 'Estate Agent',
    channel: 'email',
    subject: "Your listings are on PropertyPal. Your brand should be working for you too.",
    body: `Hi [Name],

Independent estate agents in Belfast are spending money to list on PropertyPal and put all their leads in someone else's funnel. Your website should be capturing buyers and vendors directly — building trust, showcasing local knowledge, and generating valuations without the directory dependency.

I'm Jonny from Yarn Digital. We build websites for independent NI agencies that do more than just point people to a portal.

Worth a quick conversation?

Jonny
Yarn Digital | yarndigital.co.uk`,
    tailoredServices: `Modern agency website with property search integration\nLocal SEO for buyer and vendor searches\nValuation request automation\nAbout/team page to differentiate from the chains\nArea guide content for local SEO authority`,
  },
  {
    sector: 'Accountancy',
    channel: 'email',
    subject: 'Your website has been compromised — wanted to flag it (ASM)',
    body: `Hi [Name],

I wanted to flag something before reaching out about anything else: your homepage currently has spam content injected into it — gambling-related links that are visible to Google. This is actively damaging your search rankings and your firm's credibility online.

It happens to well-established firm sites that haven't had a developer look at them in a while — the site itself is probably fine, but it needs fixing now.

I'm Jonny from Yarn Digital. We're a Belfast digital agency and we deal with exactly this kind of thing. We can fix the immediate issue and, if it's useful, talk about a proper website rebuild that would prevent it happening again.

Happy to send you a screenshot of what I'm seeing if it's helpful.

Jonny
Yarn Digital | yarndigital.co.uk | jonny@yarndigital.co.uk`,
    tailoredServices: `Immediate security audit and spam removal\nFull website rebuild on a secure, maintained platform\nLocal SEO for accountancy search terms across all NI offices\nClient intake automation\nOngoing maintenance retainer option`,
  },
];

async function seed() {
  const userId = await getUserId();

  const existing = await db.collection('outreachTemplates').where('userId', '==', userId).get();
  if (!existing.empty) {
    console.log(`${existing.size} templates already exist for this user — skipping seed.`);
    process.exit(0);
  }

  const batch = db.batch();
  for (const t of templates) {
    const ref = db.collection('outreachTemplates').doc();
    batch.set(ref, { userId, ...t, createdAt: now, updatedAt: now });
  }
  await batch.commit();
  console.log(`✅ Seeded ${templates.length} outreach templates for userId: ${userId}`);
}

seed().catch(console.error).finally(() => process.exit(0));
