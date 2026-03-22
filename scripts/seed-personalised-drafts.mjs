// Seed Aria's personalised drafts into Firestore outreachProspects
// Run: node scripts/seed-personalised-drafts.mjs
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

// Match by company name — Aria's drafts in order
const drafts = [
  {
    company: 'Broad Street Advisory',
    draftSubject: "Quick thought on Broad Street Advisory's online presence",
    draftMessage: `Hi Tony,

Independent accountancy firms in Belfast are often the best-kept secret in their area — brilliant with clients, invisible online. It's a missed opportunity when SMEs are actively looking for trusted advisors and making their decision based on what they find on Google.

I had a look at the Broad Street Advisory site — you've got strong client testimonials on there, but the site isn't earning that trust before someone reads them. The homepage is template-thin, there are no service-specific landing pages, and you're not ranking for any of the searches your next client is doing: "accountant Dunmurry," "small business accountant Belfast," "self-assessment NI."

I'm Jonny from Yarn Digital. We specialise in helping professional services firms across NI build a digital presence that actually generates enquiries — not just ticks a box.

20 minutes of your time?

Jonny
Yarn Digital — Design, Build, Grow
yarndigital.co.uk | jonny@yarndigital.co.uk`,
  },
  {
    company: 'Harbinson Mulholland Chartered Accountants',
    draftSubject: 'harbinsonmulholland.com — quick flag',
    draftMessage: `Hi Gary,

Wanted to flag something: harbinsonmulholland.com is currently returning a DNS error — the site isn't loading at all. Anyone trying to find you online right now is hitting a dead end.

Whether you're in the middle of a rebuild or something's gone wrong technically, I thought it was worth a heads up.

I'm Jonny from Yarn Digital. We work with professional services firms across Northern Ireland on brand, web, and digital. If you're between sites or looking to rebuild properly, we'd love to talk — we have a track record with NI accountancy practices and can get something sharp live quickly.

Worth a quick call?

Jonny
Yarn Digital | yarndigital.co.uk | jonny@yarndigital.co.uk`,
  },
  {
    company: 'ASM Chartered Accountants',
    draftSubject: 'Your website has been compromised — wanted to flag it',
    draftMessage: `Hi Ian,

I wanted to flag something before anything else: the ASM homepage currently has spam content injected into it — gambling-related links that are visible in the page source. This is actively damaging your search rankings and your firm's credibility online, and it's likely been there a while without anyone noticing.

It's more common than you'd think on sites that haven't had developer attention in a few years — but with a firm of ASM's size and reputation across 5 offices, it's worth fixing now.

I'm Jonny from Yarn Digital. We're a Belfast digital agency and we deal with exactly this kind of thing. We can clear the issue and, if useful, talk about a proper rebuild that would reflect where ASM is today — not where the site was when it was last touched.

Happy to send a screenshot of what I'm seeing if that's helpful.

Jonny
Yarn Digital | yarndigital.co.uk | jonny@yarndigital.co.uk`,
  },
  {
    company: 'Mills Selig',
    draftSubject: "Mills Selig's digital presence — a quick observation",
    draftMessage: `Hi Chris,

Mills Selig has one of the strongest reputations in Belfast commercial law — but your website is doing less work than your team is.

It's a Divi template, text-heavy, no clear calls to action — and for a firm of your standing, that's a mismatch. When a potential client or referrer Googles you, they're making a snap decision in about 8 seconds. The firms winning that moment aren't necessarily the best — they're the ones with the most credible, clear online presence.

I'm Jonny from Yarn Digital. We specialise in brand and web for professional services firms across Northern Ireland. We've helped similar-sized firms go from invisible online to being the obvious first choice in their niche.

Would a 20-minute call be worth your time?

Jonny
Yarn Digital | yarndigital.co.uk`,
  },
  {
    company: 'Tughans LLP',
    draftSubject: "Tughans' brand — a quick observation",
    draftMessage: `Hi Patrick,

Tughans has been ranked the number one M&A firm in Northern Ireland for ten years running. That's a serious track record. But your website doesn't lead with that — it leads with the same layout and stock-photo aesthetic as every other mid-market firm on the island.

A firm that's consistently outperforming the market deserves a digital presence that matches. The best firms in the UK are investing in how they present online — not just for aesthetics, but because it directly drives inbound enquiries and referral confidence.

I'm Jonny from Yarn Digital. I'd love to share a few specific ideas for Tughans if you're open to it.

15 minutes on a call?

Jonny
Yarn Digital | yarndigital.co.uk`,
  },
  {
    company: 'McCann & McCann Solicitors',
    draftSubject: 'McCann & McCann online — worth a conversation?',
    draftMessage: `Hi,

McCann & McCann is one of Belfast's established names in law — but the website hasn't kept pace with the firm. No local SEO, no clear service CTAs, and a contact form as the only way in. Clients are making decisions about solicitors based on what they find online before they ever pick up the phone.

I'm Jonny from Yarn Digital. We build modern, conversion-focused websites for NI professional services firms — designed to generate enquiries, not just sit there.

Worth a quick conversation about what that could look like for McCann & McCann?

Jonny
Yarn Digital | yarndigital.co.uk | jonny@yarndigital.co.uk`,
  },
  {
    company: 'Sports Medicine NI',
    draftSubject: 'Sports Medicine NI — direct bookings vs Doctify',
    draftMessage: `Hi Gareth,

Sports Medicine NI clearly runs a serious multi-disciplinary operation — the team credentials, the GAA and hockey club relationships, the facilities. But your website isn't converting that reputation into direct bookings.

Right now you're relying on third-party platforms for patient bookings — and paying for the privilege every time. A modern site with integrated online booking typically pays for itself within 2 months in recovered commission alone.

I'm Jonny from Yarn Digital. We build websites for health and sports clinics across NI — clean, professional, and built around getting patients to book directly with you.

Worth a quick call? Happy to show you some examples.

Jonny
Yarn Digital | yarndigital.co.uk`,
  },
  {
    company: 'Phoenix Physiotherapy',
    draftSubject: 'Phoenix Physiotherapy — quick thought on your website',
    draftMessage: `Hi,

I came across Phoenix Physiotherapy online and wanted to reach out — your clinic clearly offers a strong service, but your website isn't keeping up with it. For independent physio clinics, that gap between the quality of care and the quality of the online presence is costing real bookings.

I'm Jonny from Yarn Digital, a Belfast-based digital agency. We work remotely with clinics across the UK — modern, fast websites with integrated online booking that reduce platform dependency and bring patients direct to you.

Happy to have a quick call or share some examples if it's useful.

Jonny
Yarn Digital | yarndigital.co.uk | jonny@yarndigital.co.uk`,
  },
];

async function seed() {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const snap = await db.collection('outreachProspects').where('userId', '==', userId).get();
  if (snap.empty) { console.log('No prospects found — run seed-prospects.mjs first'); process.exit(1); }

  const prospects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${prospects.length} prospects`);

  let updated = 0;
  for (const draft of drafts) {
    const match = prospects.find((p) =>
      p.company.toLowerCase().includes(draft.company.toLowerCase()) ||
      draft.company.toLowerCase().includes(p.company.toLowerCase())
    );
    if (!match) { console.log(`⚠ No match for: ${draft.company}`); continue; }
    await db.collection('outreachProspects').doc(match.id).update({
      draftSubject: draft.draftSubject,
      draftMessage: draft.draftMessage,
      updatedAt: now,
    });
    console.log(`✅ ${draft.company} → draft saved`);
    updated++;
  }

  console.log(`\nDone. ${updated}/${drafts.length} prospects updated.`);
}

seed().catch(console.error).finally(() => process.exit(0));
