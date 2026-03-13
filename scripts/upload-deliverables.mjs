#!/usr/bin/env node
/**
 * Upload all deliverables from /root/.openclaw/workspace/deliverables/ to Firestore
 * so they appear on yd-dashboard.vercel.app/documents
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync as readFileSync2 } from 'fs';

// Load env manually (no dotenv dependency)
const envPath = join(import.meta.dirname, '..', '.env.local');
const envContent = readFileSync2(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx);
  const val = trimmed.substring(eqIdx + 1);
  if (!process.env[key]) process.env[key] = val;
}

// Init Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const DELIVERABLES_DIR = '/root/.openclaw/workspace/deliverables';

// Map subdirectory to agent name
const AGENT_MAP = {
  'aria': 'Aria',
  'scout': 'Scout',
  'radar': 'Radar',
  'bolt': 'Bolt',
  'blaze': 'Blaze',
};

// Map agent to category based on role
const CATEGORY_MAP = {
  'Aria': 'Creative & Content',
  'Scout': 'Research & Strategy',
  'Radar': 'Analytics & Monitoring',
  'Bolt': 'Development',
  'Blaze': 'Ads & Paid Media',
};

function findMarkdownFiles(dir, agentHint = '') {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      const agent = AGENT_MAP[entry] || agentHint;
      results.push(...findMarkdownFiles(fullPath, agent));
    } else if (extname(entry) === '.md') {
      results.push({ path: fullPath, agent: agentHint || 'Bolt', filename: entry });
    }
  }
  return results;
}

function titleFromFilename(filename) {
  return filename
    .replace('.md', '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function main() {
  const files = findMarkdownFiles(DELIVERABLES_DIR);
  console.log(`Found ${files.length} deliverables to upload\n`);

  let created = 0, updated = 0;

  for (const file of files) {
    const content = readFileSync(file.path, 'utf8');
    const title = titleFromFilename(file.filename);
    const agent = file.agent;
    const category = CATEGORY_MAP[agent] || 'General';
    const sizeBytes = Buffer.byteLength(content, 'utf8');
    const size = sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(1)} KB` : `${sizeBytes} B`;
    const preview = content.substring(0, 300).replace(/[#*_\-`]/g, '').trim();
    const now = new Date().toISOString();

    // Check if doc with same title + agent already exists
    const existing = await db.collection('documents')
      .where('title', '==', title)
      .where('agent', '==', agent)
      .limit(1)
      .get();

    const docData = {
      title,
      filename: file.filename,
      agent,
      category,
      description: preview.substring(0, 150),
      size,
      status: 'completed',
      updated: now,
      filePath: file.path.replace(DELIVERABLES_DIR + '/', ''),
      contentPreview: preview,
      content,
      tags: [category.toLowerCase(), agent.toLowerCase()],
      version: '1.0',
      type: 'markdown',
    };

    if (!existing.empty) {
      await db.collection('documents').doc(existing.docs[0].id).update(docData);
      console.log(`  Updated: ${title} (${agent})`);
      updated++;
    } else {
      docData.created = now;
      await db.collection('documents').add(docData);
      console.log(`  Created: ${title} (${agent})`);
      created++;
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
