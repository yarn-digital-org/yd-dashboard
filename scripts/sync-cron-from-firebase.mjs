#!/usr/bin/env node
/**
 * Reverse sync: Pull cron jobs created in the dashboard (Firebase)
 * and create them as real OpenClaw cron jobs locally.
 * Picks up items with pendingSync: true
 *
 * Usage: node scripts/sync-cron-from-firebase.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

const COLLECTION = 'openclaw_cron_jobs';
const CRON_FILE = '/root/.openclaw/cron/jobs.json';

const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT
  || (process.env.FIREBASE_CREDENTIALS_BASE64
    ? Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf-8')
    : null);

if (!saRaw) {
  console.error('No Firebase credentials found');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(saRaw)) });
const db = getFirestore();

// Find pending sync items
const snapshot = await db.collection(COLLECTION).where('pendingSync', '==', true).get();

if (snapshot.empty) {
  console.log('No pending cron jobs to sync');
  process.exit(0);
}

// Read existing local cron jobs
let localCron = { version: 1, jobs: [] };
if (existsSync(CRON_FILE)) {
  localCron = JSON.parse(readFileSync(CRON_FILE, 'utf-8'));
}

const existingIds = new Set(localCron.jobs.map(j => j.id));

for (const doc of snapshot.docs) {
  const data = doc.data();
  const cronId = doc.id;

  if (existingIds.has(cronId)) {
    // Update existing job (enable/disable)
    const idx = localCron.jobs.findIndex(j => j.id === cronId);
    if (idx !== -1) {
      localCron.jobs[idx].enabled = data.enabled;
      localCron.jobs[idx].updatedAtMs = Date.now();
      console.log(`Updated existing cron job: ${data.name} (enabled: ${data.enabled})`);
    }
  } else {
    // Create new cron job
    const newJob = {
      id: cronId,
      agentId: data.agentId || 'main',
      name: data.name,
      description: data.description || '',
      enabled: data.enabled ?? true,
      createdAtMs: data.createdAtMs || Date.now(),
      updatedAtMs: Date.now(),
      schedule: data.schedule || { kind: 'every', everyMs: 3600000, anchorMs: Date.now() },
      sessionTarget: data.sessionTarget || 'isolated',
      wakeMode: 'now',
      payload: data.payload || {
        kind: 'agentTurn',
        message: 'No message configured',
        timeoutSeconds: 300,
      },
      state: {},
      delivery: { mode: 'announce' },
    };
    localCron.jobs.push(newJob);
    console.log(`Created new cron job: ${data.name}`);
  }

  // Mark as synced in Firebase
  await doc.ref.update({
    pendingSync: false,
    syncedAt: new Date().toISOString(),
    localId: cronId,
  });
}

// Write back to local cron file
writeFileSync(CRON_FILE, JSON.stringify(localCron, null, 2));
console.log(`Wrote ${localCron.jobs.length} jobs to ${CRON_FILE}`);

// Reload the cron scheduler
try {
  execSync('openclaw gateway restart', { stdio: 'inherit' });
  console.log('Restarted gateway to pick up new cron jobs');
} catch (err) {
  console.log('Note: Could not restart gateway. You may need to run: openclaw gateway restart');
}
