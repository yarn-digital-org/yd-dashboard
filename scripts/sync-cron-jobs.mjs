#!/usr/bin/env node
/**
 * Sync OpenClaw cron jobs to Firebase for the yd-dashboard.
 * Reads from /root/.openclaw/cron/jobs.json and writes to
 * the `openclaw_cron_jobs` Firestore collection.
 *
 * Usage: node scripts/sync-cron-jobs.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Manual .env loading (no dotenv dependency)
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
for (const envFile of ['.env.local', '.env']) {
  const p = resolve(projectRoot, envFile);
  if (existsSync(p)) {
    const lines = readFileSync(p, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}

const CRON_FILE = '/root/.openclaw/cron/jobs.json';
const COLLECTION = 'openclaw_cron_jobs';

// Init Firebase
const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT
  || (process.env.FIREBASE_CREDENTIALS_BASE64
    ? Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf-8')
    : null);

if (!saRaw) {
  console.error('No Firebase credentials found in env');
  process.exit(1);
}

const serviceAccount = JSON.parse(saRaw);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Read cron jobs
let cronData;
try {
  cronData = JSON.parse(readFileSync(CRON_FILE, 'utf-8'));
} catch (err) {
  console.error(`Failed to read ${CRON_FILE}:`, err.message);
  process.exit(1);
}

const jobs = cronData.jobs || [];
console.log(`Found ${jobs.length} cron jobs to sync`);

// Sync to Firestore
const batch = db.batch();

for (const job of jobs) {
  const docRef = db.collection(COLLECTION).doc(job.id);
  batch.set(docRef, {
    id: job.id,
    name: job.name || 'Unnamed',
    description: job.description || '',
    enabled: job.enabled || false,
    schedule: job.schedule || {},
    payload: job.payload || {},
    state: job.state || {},
    agentId: job.agentId || '',
    sessionTarget: job.sessionTarget || '',
    createdAtMs: job.createdAtMs || 0,
    updatedAtMs: job.updatedAtMs || 0,
    syncedAt: new Date().toISOString(),
  }, { merge: true });
}

// Remove jobs from Firestore that no longer exist locally
const existing = await db.collection(COLLECTION).get();
const localIds = new Set(jobs.map(j => j.id));
for (const doc of existing.docs) {
  if (!localIds.has(doc.id)) {
    console.log(`Removing stale cron job: ${doc.id}`);
    batch.delete(doc.ref);
  }
}

await batch.commit();
console.log(`Synced ${jobs.length} cron jobs to Firestore collection '${COLLECTION}'`);
