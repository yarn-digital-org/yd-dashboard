#!/usr/bin/env node

/**
 * Upload Meta Ad creative docs to YD Dashboard Firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const now = new Date().toISOString();

async function main() {
  // Read the files
  const styleGuide = fs.readFileSync(
    path.join(__dirname, '../../yarn-creatives/STYLE-GUIDE.md'), 'utf8'
  );
  const adResearch = fs.readFileSync(
    path.join(__dirname, '../../yarn-creatives/meta-ad-angles-research-digital-agencies.md'), 'utf8'
  );

  const documents = [
    {
      id: 'ref_meta_ad_style_guide',
      title: 'Reference: Yarn Digital Ad Creative Style Guide',
      filename: 'meta-ad-style-guide.md',
      agent: 'Aria',
      category: 'References',
      description: 'Visual style guide for all Yarn Digital Meta ad creatives. Dark/minimal/typography-led aesthetic. Based on existing approved creatives.',
      status: 'completed',
      tags: ['reference', 'meta-ads', 'creative', 'style-guide', 'aria'],
      version: '1.0',
      type: 'markdown',
      content: styleGuide,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ref_meta_ad_research',
      title: 'Research: Meta Ad Angles for Digital Agencies',
      filename: 'meta-ad-angles-research.md',
      agent: 'Scout',
      category: 'References',
      description: 'Research on high-converting Meta ad angles, SME psychology, messaging frameworks, and platform-specific guidance for digital agency ads.',
      status: 'completed',
      tags: ['reference', 'meta-ads', 'research', 'scout', 'creative'],
      version: '1.0',
      type: 'markdown',
      content: adResearch,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const doc of documents) {
    const { id, ...data } = doc;
    await db.collection('documents').doc(id).set(data, { merge: true });
    console.log(`✅ Uploaded: ${doc.title}`);
  }

  console.log('\nDone. Both documents now in dashboard.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
