// Seed outreach prospects into Firestore from Scout's named list
// Run: node scripts/seed-prospects.mjs
import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envContent = readFileSync('.env.local', 'utf8');
const saMatch = envContent.match(/FIREBASE_SERVICE_ACCOUNT=(.+)/);
const serviceAccount = JSON.parse(saMatch[1].trim());

if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const now = new Date().toISOString();

async function getUserId() {
  const snap = await db.collection('users').where('email', '==', 'jonny@yarndigital.co.uk').limit(1).get();
  if (!snap.empty) return snap.docs[0].id;
  throw new Error('User not found');
}

const prospects = [
  // ACCOUNTANCY
  {
    company: 'Broad Street Advisory',
    sector: 'Accountancy',
    website: 'https://www.broadstreetadvisory.co',
    decisionMaker: 'Tony McAleenan',
    title: 'Principal',
    contactMethod: 'email',
    contactValue: 'info@broadstreetadvisory.co',
    painPoint: 'Basic template homepage, no service pages, no blog, no local SEO — strong client testimonials but the site earns zero Google impressions.',
    notes: 'Also try tony@broadstreetadvisory.co. Jonny confirmed: "terrible website, needs a lot of TLC".',
    status: 'identified',
  },
  {
    company: 'Harbinson Mulholland Chartered Accountants',
    sector: 'Accountancy',
    website: 'https://www.harbinsonmulholland.com',
    decisionMaker: 'Gary Harbinson',
    title: 'Managing Partner',
    contactMethod: 'linkedin',
    contactValue: 'https://www.linkedin.com/company/harbinson-mulholland',
    painPoint: 'Established mid-size Belfast CA firm — digital presence has historically lagged behind their reputation. Site currently returning DNS error (may be under maintenance = opportunity).',
    notes: 'Verify site status before outreach. DNS issue may indicate rebuild in progress.',
    status: 'identified',
  },
  {
    company: 'ASM Chartered Accountants',
    sector: 'Accountancy',
    website: 'https://www.asmaccountants.com',
    decisionMaker: 'Ian Finnegan',
    title: 'Director (Newry HQ)',
    contactMethod: 'email',
    contactValue: 'mail@asmnewry.com',
    painPoint: 'Homepage compromised with spam/gambling backlinks injected — active SEO and credibility risk. Broken news feeds, dated design. Major NI firm (5 offices) not investing in digital.',
    notes: 'FAO Ian Finnegan. Use the ASM special template — lead with the spam injection, not the redesign pitch.',
    status: 'identified',
  },
  // SOLICITORS
  {
    company: 'Mills Selig',
    sector: 'Solicitors',
    website: 'https://millsselig.com',
    decisionMaker: 'Chris Guy',
    title: 'Managing Partner',
    contactMethod: 'email',
    contactValue: 'info@millsselig.com',
    painPoint: 'Built on Divi (WordPress page builder), text-heavy, no clear client journey or CTAs — poor digital experience for one of Belfast\'s leading commercial law firms.',
    notes: 'Also find Chris Guy on LinkedIn: https://www.linkedin.com/company/mills-selig/. Jonny confirmed: "website is poor for weight of firm".',
    status: 'identified',
  },
  {
    company: 'Tughans LLP',
    sector: 'Solicitors',
    website: 'https://www.tughans.com',
    decisionMaker: 'Patrick Brown',
    title: 'Managing Partner',
    contactMethod: 'email',
    contactValue: 'info@tughans.com',
    painPoint: 'NI\'s #1 ranked M&A firm for 10 consecutive years — website is sparse and generic, completely failing to match their dominant market position.',
    notes: 'Also try patrick.brown@tughans.com. LinkedIn: https://www.linkedin.com/company/tughans-solicitors/. Jonny confirmed: "firm\'s reputation strong, digital presence isn\'t earning its keep".',
    status: 'identified',
  },
  {
    company: 'McCann & McCann Solicitors',
    sector: 'Solicitors',
    website: 'https://www.mccannandmccann.com',
    decisionMaker: 'Sean McCann',
    title: 'Founding Partner',
    contactMethod: 'phone',
    contactValue: '028 9024 6405',
    painPoint: 'Site looks early 2000s — no modern design, no CTAs beyond "contact us", no local SEO, no online booking. Active firm, completely dormant digital presence.',
    notes: 'Established 1980. Also Jim McCann (co-founder). Direct phone intro or contact form. 19 Church Street, Belfast BT1 1PG.',
    status: 'identified',
  },
  // PHYSIO
  {
    company: 'Sports Medicine NI',
    sector: 'Physio/Sports Rehab',
    website: 'https://www.sportsmedicineni.com',
    decisionMaker: 'Gareth',
    title: 'Director',
    contactMethod: 'phone',
    contactValue: '028 9019 0290',
    painPoint: 'Site hasn\'t been updated in years — no online booking, no clear conversion path, relies on Doctify/third-party for appointments. Strong GAA/hockey/football team client base not reflected.',
    notes: 'Surname not publicly listed — find via LinkedIn. Designed by Kaizen Brand Evolution (credited in footer). Jonny noted team page looks fine, so drop that angle.',
    status: 'identified',
  },
  {
    company: 'The Mummy Physios',
    sector: 'Physio/Sports Rehab',
    website: 'https://themummyphysios.com',
    decisionMaker: 'Founder',
    title: 'Founder',
    contactMethod: 'instagram',
    contactValue: '@themummyphysios',
    painPoint: 'WordPress site with generic layout, no local SEO for "women\'s health physio Belfast/NI", contact-form only for bookings. Strong niche (pelvic floor, postnatal) but zero digital presence to match.',
    notes: 'Email: info@themummyphysios.com. Phone: 07761 742856. Location: 13 Station Road, Moneymore. Also offer online consultations. Instagram DM is warmest channel.',
    status: 'identified',
  },
  {
    company: 'Phoenix Physiotherapy',
    sector: 'Physio/Sports Rehab',
    website: 'https://phoenixphysio.co.uk',
    decisionMaker: 'Clinic Director',
    title: 'Director',
    contactMethod: 'linkedin',
    contactValue: 'https://www.linkedin.com/search/results/all/?keywords=Phoenix+Physiotherapy+Belfast',
    painPoint: 'Generic template site, no local SEO, no online booking, no testimonials on homepage. Heavy reliance on template content, no brand differentiation.',
    notes: 'Jonny confirmed keep even though based in England — remote outreach is fine. Verify Belfast NI vs England via LinkedIn/Google Maps before sending.',
    status: 'identified',
  },
];

async function seed() {
  const userId = await getUserId();

  const existing = await db.collection('outreachProspects').where('userId', '==', userId).get();
  if (!existing.empty) {
    console.log(`${existing.size} prospects already exist — skipping seed.`);
    process.exit(0);
  }

  const batch = db.batch();
  for (const p of prospects) {
    const ref = db.collection('outreachProspects').doc();
    batch.set(ref, { userId, ...p, approvedAt: null, sentAt: null, repliedAt: null, createdAt: now, updatedAt: now });
  }
  await batch.commit();
  console.log(`✅ Seeded ${prospects.length} prospects for userId: ${userId}`);
}

seed().catch(console.error).finally(() => process.exit(0));
