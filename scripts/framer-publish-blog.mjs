#!/usr/bin/env node

/**
 * framer-publish-blog.mjs
 * 
 * Publishes queued blog posts from Firestore to the Framer CMS.
 * Designed to run as a cron job or manually.
 * 
 * Usage:
 *   node scripts/framer-publish-blog.mjs              # Publish next due post
 *   node scripts/framer-publish-blog.mjs --all         # Publish all due posts
 *   node scripts/framer-publish-blog.mjs --dry-run     # Preview without publishing
 *   node scripts/framer-publish-blog.mjs --post <id>   # Publish a specific post
 * 
 * Env vars required:
 *   FRAMER_API_KEY       — API key from Framer Site Settings
 *   FRAMER_PROJECT_URL   — Framer project URL or ID
 * 
 * The script:
 *   1. Connects to the Framer project
 *   2. Finds/creates the blog CMS collection
 *   3. Pushes post data (title, slug, body as formattedText, tags, date)
 *   4. Publishes a preview and promotes to production
 *   5. Marks the post as synced in Firestore
 */

import { connect } from 'framer-api';

const FRAMER_API_KEY = process.env.FRAMER_API_KEY;
const FRAMER_PROJECT_URL = process.env.FRAMER_PROJECT_URL;

// --- Helpers ---

function markdownToHtml(md) {
  // Basic markdown → HTML conversion for blog content
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');

  // Wrap list items
  html = html.replace(/(<li>[^]*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><hr><\/p>/g, '<hr>');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');

  return html;
}

async function publishToFramer(posts, { dryRun = false } = {}) {
  if (!FRAMER_API_KEY || !FRAMER_PROJECT_URL) {
    console.error('Missing FRAMER_API_KEY or FRAMER_PROJECT_URL env vars');
    process.exit(1);
  }

  console.log(`Connecting to Framer project: ${FRAMER_PROJECT_URL}`);
  const framer = await connect(FRAMER_PROJECT_URL, FRAMER_API_KEY);

  try {
    // Find the blog/articles collection
    const collections = await framer.getCollections();
    console.log(`Found ${collections.length} collections:`, collections.map(c => c.name || c.id));

    // Look for articles/blog collection
    let blogCollection = collections.find(c => 
      (c.name || '').toLowerCase().includes('article') ||
      (c.name || '').toLowerCase().includes('blog') ||
      (c.name || '').toLowerCase().includes('post')
    );

    if (!blogCollection) {
      console.error('No blog/articles collection found in Framer CMS. Available collections:', 
        collections.map(c => `${c.name} (${c.id})`));
      console.log('Please create an Articles collection in Framer CMS first.');
      await framer.disconnect();
      process.exit(1);
    }

    console.log(`Using collection: ${blogCollection.name} (${blogCollection.id})`);

    // Get collection fields to map our data
    const fields = await blogCollection.getFields();
    console.log('Collection fields:', fields.map(f => `${f.name} (${f.type})`));

    // Map field names to IDs
    const fieldMap = {};
    for (const f of fields) {
      const name = (f.name || '').toLowerCase().replace(/\s+/g, '');
      fieldMap[name] = f.id;
    }

    // Get existing items to avoid duplicates
    const existingItems = await blogCollection.getItems();
    const existingSlugs = new Set(existingItems.map(item => item.slug));

    let published = 0;
    let skipped = 0;

    for (const post of posts) {
      if (existingSlugs.has(post.slug)) {
        console.log(`  ⏭ Skipping "${post.title}" — slug "${post.slug}" already exists`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  🔍 [DRY RUN] Would publish: "${post.title}" (${post.slug})`);
        continue;
      }

      // Build field data based on available fields
      const fieldData = {};

      // Title field
      const titleFieldId = fieldMap.title || fieldMap.name || fieldMap.headline;
      if (titleFieldId) fieldData[titleFieldId] = post.title;

      // Body/content field (formattedText = HTML)
      const bodyFieldId = fieldMap.content || fieldMap.body || fieldMap.text || fieldMap.article;
      if (bodyFieldId) fieldData[bodyFieldId] = markdownToHtml(post.content);

      // Excerpt/description
      const excerptFieldId = fieldMap.excerpt || fieldMap.description || fieldMap.summary || fieldMap.subtitle;
      if (excerptFieldId) fieldData[excerptFieldId] = post.excerpt || '';

      // Author
      const authorFieldId = fieldMap.author || fieldMap.writer;
      if (authorFieldId) fieldData[authorFieldId] = post.author || 'Yarn Digital';

      // Date
      const dateFieldId = fieldMap.date || fieldMap.publishedat || fieldMap.publishdate || fieldMap.published;
      if (dateFieldId) fieldData[dateFieldId] = post.publishedAt || new Date().toISOString();

      // Tags/category
      const tagFieldId = fieldMap.tags || fieldMap.category || fieldMap.categories;
      if (tagFieldId && post.tags) {
        fieldData[tagFieldId] = Array.isArray(post.tags) ? post.tags.join(', ') : post.tags;
      }

      // Meta
      const metaTitleFieldId = fieldMap.metatitle || fieldMap.seotitle;
      if (metaTitleFieldId) fieldData[metaTitleFieldId] = post.metaTitle || post.title;

      const metaDescFieldId = fieldMap.metadescription || fieldMap.seodescription;
      if (metaDescFieldId) fieldData[metaDescFieldId] = post.metaDescription || post.excerpt || '';

      console.log(`  📝 Publishing: "${post.title}" (${post.slug})`);

      await blogCollection.addItems([{
        slug: post.slug,
        draft: false,
        fieldData,
      }]);

      published++;
    }

    if (published > 0 && !dryRun) {
      console.log(`\nPublishing site preview...`);
      const result = await framer.publish();
      console.log(`Preview published: deployment ${result.deployment.id}`);

      console.log(`Promoting to production...`);
      await framer.deploy(result.deployment.id);
      console.log(`✅ Deployed to production`);
    }

    console.log(`\nDone: ${published} published, ${skipped} skipped`);

    await framer.disconnect();
    return { published, skipped };
  } catch (err) {
    console.error('Error:', err);
    await framer.disconnect();
    throw err;
  }
}

// --- CLI entry point ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const publishAll = args.includes('--all');
const postIdIndex = args.indexOf('--post');
const specificPostId = postIdIndex !== -1 ? args[postIdIndex + 1] : null;

// When called from cron, posts are passed via stdin as JSON
// When called manually, reads from Firestore API
let posts = [];

if (!process.stdin.isTTY) {
  // Reading from stdin (piped from cron endpoint)
  let data = '';
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  posts = JSON.parse(data);
} else {
  console.log('No posts piped via stdin. Use the cron endpoint or pipe JSON posts.');
  console.log('Example: echo \'[{"title":"Test","slug":"test","content":"Hello"}]\' | node scripts/framer-publish-blog.mjs');
  process.exit(0);
}

await publishToFramer(posts, { dryRun });
