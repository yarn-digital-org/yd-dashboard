#!/usr/bin/env node

/**
 * Migration script to move documents from local filesystem to Firestore
 * 
 * This fixes the production issue where documents are read from local files
 * that don't exist on Vercel's serverless environment.
 */

const { readFileSync, readdirSync, statSync } = require('fs');
const { join, basename } = require('path');

// Import Firebase admin
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : process.env.FIREBASE_CREDENTIALS_BASE64
  ? JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf-8'))
  : null;

if (!serviceAccount) {
  console.error('❌ Firebase credentials not found. Please check FIREBASE_SERVICE_ACCOUNT or FIREBASE_CREDENTIALS_BASE64 env vars.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
});

const db = admin.firestore();

// Document processing functions
function extractTitle(content, filename) {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  
  return basename(filename, '.md')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function extractDescription(content) {
  const lines = content.split('\n');
  
  let foundHeading = false;
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('#')) {
      foundHeading = true;
      continue;
    }
    
    if (foundHeading && trimmed && !trimmed.startsWith('##')) {
      return trimmed.length > 150 ? trimmed.substring(0, 147) + '...' : trimmed;
    }
  }
  
  return 'Document description';
}

function determineCategory(filename, content) {
  const name = filename.toLowerCase();
  const text = content.toLowerCase();
  
  if (name.includes('seo') || name.includes('competitor') || text.includes('keyword') || text.includes('backlink')) {
    return 'SEO & Analysis';
  }
  if (name.includes('analytics') || name.includes('baseline') || name.includes('monitoring')) {
    return 'Analytics';
  }
  if (name.includes('social') || name.includes('content') || name.includes('calendar')) {
    return 'Content & Social';
  }
  if (name.includes('brand') || name.includes('voice') || name.includes('guide')) {
    return 'Brand & Strategy';
  }
  if (name.includes('skill') || name.includes('campaign') || name.includes('lead')) {
    return 'Skills & Training';
  }
  if (name.includes('plan') || name.includes('action') || name.includes('strategy')) {
    return 'Strategy & Planning';
  }
  
  return 'General';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function migrateDocuments() {
  console.log('🚀 Starting document migration to Firestore...\n');
  
  const deliverablesPath = join(__dirname, '../deliverables');
  const documents = [];
  
  try {
    // Scan agent directories
    const agentDirs = readdirSync(deliverablesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`📁 Found agent directories: ${agentDirs.join(', ')}\n`);
    
    for (const agentDir of agentDirs) {
      const agentPath = join(deliverablesPath, agentDir);
      const agent = agentDir.charAt(0).toUpperCase() + agentDir.slice(1);
      
      console.log(`📂 Processing ${agent} directory...`);
      
      // Get all .md files (including subdirectories)
      const scanDirectory = (dir, relativePath = '') => {
        const items = readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = join(dir, item.name);
          const relPath = join(relativePath, item.name);
          
          if (item.isDirectory()) {
            scanDirectory(fullPath, relPath);
          } else if (item.isFile() && item.name.endsWith('.md')) {
            try {
              const content = readFileSync(fullPath, 'utf-8');
              const stats = statSync(fullPath);
              
              const document = {
                id: `${agent.toLowerCase()}_${relPath.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
                title: extractTitle(content, item.name),
                filename: item.name,
                agent: agent,
                category: determineCategory(item.name, content),
                description: extractDescription(content),
                size: formatFileSize(stats.size),
                status: 'completed',
                created: stats.birthtime.toISOString(),
                updated: stats.mtime.toISOString(),
                content: content,
                contentPreview: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
                filePath: relPath,
                tags: [],
                version: '1.0',
                type: 'markdown'
              };
              
              documents.push(document);
              console.log(`  ✅ ${relPath} (${document.size})`);
              
            } catch (error) {
              console.log(`  ❌ Failed to process ${relPath}: ${error.message}`);
            }
          }
        }
      };
      
      scanDirectory(agentPath);
      console.log('');
    }
    
    console.log(`📊 Total documents to migrate: ${documents.length}\n`);
    
    // Upload to Firestore
    console.log('☁️  Uploading to Firestore...\n');
    
    const batch = db.batch();
    const documentsRef = db.collection('documents');
    
    for (const doc of documents) {
      const docRef = documentsRef.doc(doc.id);
      batch.set(docRef, doc);
      console.log(`  ⬆️  ${doc.agent}: ${doc.title}`);
    }
    
    await batch.commit();
    
    console.log(`\n✅ Successfully migrated ${documents.length} documents to Firestore!`);
    console.log(`\n📋 Summary by agent:`);
    
    const agentCounts = {};
    documents.forEach(doc => {
      agentCounts[doc.agent] = (agentCounts[doc.agent] || 0) + 1;
    });
    
    Object.entries(agentCounts).forEach(([agent, count]) => {
      console.log(`  ${agent}: ${count} documents`);
    });
    
    console.log(`\n🎯 Next steps:`);
    console.log(`  1. Update Documents API to read from Firestore`);
    console.log(`  2. Remove filesystem imports`);
    console.log(`  3. Test and deploy`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateDocuments()
  .then(() => {
    console.log('\n🏁 Migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });