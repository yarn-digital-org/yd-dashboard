// Seed personalised draftSubject + draftMessage into existing prospect records
// Run: node scripts/seed-prospect-drafts.mjs
import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envContent = readFileSync('.env.local', 'utf8');
const saMatch = envContent.match(/FIREBASE_SERVICE_ACCOUNT=(.+)/);
const serviceAccount = JSON.parse(saMatch[1].trim());

if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function getUserId() {
  const snap = await db.collection('users').where('email', '==', 'jonny@yarndigital.co.uk').limit(1).get();
  if (!snap.empty) return snap.docs[0].id;
  throw new Error('User not found');
}

const drafts = {
  'Broad Street Advisory': {
    draftSubject: "Your digital presence isn't earning its keep",
    draftMessage: `Hi Tony,

Broad Street Advisory clearly works with serious clients — the testimonials and credentials on your site say that. But the site itself is working against you: it's invisible on Google for the searches your next client is already making ("accountant Belfast," "small business accountant NI," "self-assessment help Belfast"), and the template layout means those strong testimonials are doing nothing.

I'm Jonny from Yarn Digital. We build websites and digital presence for professional services firms across Northern Ireland — clean, fast, built to convert. We recently helped a Belfast advisory firm go from zero inbound enquiries to two unsolicited mid-size company approaches within 6 weeks of launch.

Worth a 20-minute call to see if there's something similar we could do for Broad Street Advisory?

Jonny
Yarn Digital — Design, Build, Grow
yarndigital.co.uk | jonny@yarndigital.co.uk`,
  },
  'Harbinson Mulholland Chartered Accountants': {
    draftSubject: "Harbinson Mulholland's website is currently down",
    draftMessage: `Hi Gary,

Wanted to flag this before anything else: harbinsonmulholland.com is currently returning a DNS error — the site is down, and anyone searching for the firm is hitting a dead end. For a Belfast practice with Harbinson Mulholland's profile, that's not a good first impression.

Whether it's a mid-rebuild moment or an oversight, it's worth knowing — and it's also a good time to ask whether the next version of the site does justice to the firm's reputation.

I'm Jonny from Yarn Digital. We build websites for professional services firms across Northern Ireland. Happy to have a quick call about the immediate fix and what a proper rebuild could look like.

Jonny
Yarn Digital | yarndigital.co.uk | jonny@yarndigital.co.uk`,
  },
  'ASM Chartered Accountants': {
    draftSubject: "Your website has been compromised — wanted to flag it",
    draftMessage: `Hi Ian,

I wanted to flag something before reaching out about anything else: ASM's homepage currently has spam content injected into it — gambling-related links that are visible to Google. This is actively damaging your search rankings and your firm's credibility online. With 5 offices across NI and a firm of ASM's standing, that's a serious problem.

It happens to well-established sites that haven't had a developer look at them in a while — your team page is also returning a 404, and the news feed is broken. None of this is unusual, but it needs fixing now.

I'm Jonny from Yarn Digital. We're a Belfast digital agency and we deal with exactly this kind of thing. We can fix the immediate issue and, if it's useful, talk about a rebuild that matches the weight of the firm and prevents this happening again.

Happy to send you a screenshot of what I'm seeing.

Jonny
Yarn Digital | yarndigital.co.uk | jonny@yarndigital.co.uk`,
  },
  'Mills Selig': {
    draftSubject: "Mills Selig's digital presence — a quick observation",
    draftMessage: `Hi Chris,

Mills Selig has a strong reputation in Belfast corporate law — but the website is doing less work than your team is. The Divi template and text-heavy layout mean a potential client who Googles the firm is making an 8-second judgement on a site that undersells what you actually do.

The firms winning those moments aren't necessarily better — they just present better. A site that reflects Mills Selig's actual standing, with clear practice area pages and a proper client journey, would make a real difference to inbound.

I'm Jonny from Yarn Digital. We build websites for professional services firms across NI. Happy to show you a couple of examples of what we've done.

Jonny
Yarn Digital | yarndigital.co.uk`,
  },
  'Tughans LLP': {
    draftSubject: "Tughans' digital presence — a quick observation",
    draftMessage: `Hi Patrick,

Tughans has been the leading M&A firm in Northern Ireland for a decade — that's a remarkable track record. But the website doesn't carry that authority. When a CEO or a referred client Googles the firm, they should land somewhere that immediately confirms they've found the right people. Right now it doesn't do that.

The mismatch between Tughans' actual standing and its online presence is the kind of thing we fix. We build websites for NI professional services firms that do justice to the firm's depth — credible, fast, and built around the client journey rather than the firm's internal structure.

Worth a 20-minute call?

Jonny
Yarn Digital | yarndigital.co.uk`,
  },
  'McCann & McCann Solicitors': {
    draftSubject: "McCann & McCann's digital presence — a quick observation",
    draftMessage: `Hi Sean,

McCann & McCann has been part of Belfast's legal community since 1980 — that kind of longevity and client trust is genuinely valuable. But the website isn't reflecting it. No clear practice area structure, no CTAs, no SEO visibility — a potential client Googling for a Belfast solicitor right now won't find you, and if they do, the site doesn't close the deal.

With 45+ years of experience, you shouldn't be losing work to newer firms with better websites. We fix that.

I'm Jonny from Yarn Digital. We build websites for professional services firms across NI. Happy to show you what a difference a focused rebuild makes.

Jonny
Yarn Digital | yarndigital.co.uk`,
  },
  'Sports Medicine NI': {
    draftSubject: "Your website isn't keeping up with your clinic",
    draftMessage: `Hi Gareth,

Sports Medicine NI clearly runs a serious operation — the GAA, hockey, and football connections speak for themselves. But the website isn't keeping up: no online booking means every patient goes through a third-party platform, costing commission every time, and the site doesn't showcase the sporting credentials that make the clinic stand out.

A modern website with integrated booking pays for itself within 2 months in most cases — and it would do justice to what the clinic actually does for elite and amateur sport in NI.

I'm Jonny from Yarn Digital. We build websites for health and sports clinics across NI. Happy to show you some examples.

Jonny
Yarn Digital | yarndigital.co.uk`,
  },
  'Phoenix Physiotherapy': {
    draftSubject: "Your website isn't keeping up with your clinic",
    draftMessage: `Hi,

Phoenix Physiotherapy's clinical offering is clear — but the website is holding you back. Outdated design, no online booking integration, limited SEO visibility. Patients searching for physio in your area are being sent elsewhere by Google before they even find you.

I'm Jonny from Yarn Digital. We build websites for independent physio clinics — clean, modern, built around direct bookings. Happy to show you what we've done for similar practices.

Jonny
Yarn Digital | yarndigital.co.uk`,
  },
};

async function seed() {
  const userId = await getUserId();

  const snap = await db.collection('outreachProspects').where('userId', '==', userId).get();
  if (snap.empty) {
    console.log('No prospects found for this user. Run seed-prospects.mjs first.');
    process.exit(1);
  }

  console.log(`Found ${snap.size} prospects. Updating drafts...`);
  const now = new Date().toISOString();
  let updated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const draft = drafts[data.company];
    if (!draft) {
      console.log(`  ⚠️  No draft for: ${data.company}`);
      skipped++;
      continue;
    }
    await doc.ref.update({
      draftSubject: draft.draftSubject,
      draftMessage: draft.draftMessage,
      draftStatus: 'ready',
      updatedAt: now,
    });
    console.log(`  ✅ ${data.company}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

seed().catch(console.error).finally(() => process.exit(0));
