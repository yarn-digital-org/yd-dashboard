import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/cron/blog-publish
 * 
 * Daily cron job that:
 * 1. Finds blog posts with publishDate <= now AND status = 'draft' AND framerSynced != true
 * 2. Publishes them to Framer CMS via the Server API
 * 3. Updates status to 'published' and marks framerSynced = true
 * 
 * Can also be triggered manually. Protected by CRON_SECRET or AGENT_API_KEY.
 * 
 * Vercel Cron config (add to vercel.json):
 *   { "crons": [{ "path": "/api/cron/blog-publish", "schedule": "0 9 * * *" }] }
 */

// Lightweight markdown → HTML for Framer formattedText fields
function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><hr><\/p>/g, '<hr>');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');

  return html;
}

export async function POST(request: NextRequest) {
  try {
    // Auth: CRON_SECRET (Vercel cron) or AGENT_API_KEY (manual trigger)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const agentKey = process.env.AGENT_API_KEY;
    const cookieToken = request.cookies.get('auth_token')?.value;

    const isAuthed = 
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (agentKey && authHeader?.startsWith('Bearer ') && authHeader.slice(7) === agentKey) ||
      !!cookieToken;

    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const framerApiKey = process.env.FRAMER_API_KEY;
    const framerProjectUrl = process.env.FRAMER_PROJECT_URL;

    if (!framerApiKey || !framerProjectUrl) {
      return NextResponse.json({ 
        error: 'Framer not configured',
        detail: 'Set FRAMER_API_KEY and FRAMER_PROJECT_URL env vars'
      }, { status: 500 });
    }

    const now = new Date().toISOString();

    // Find posts due for publishing
    // Query: status = 'draft' AND publishDate <= now
    let query = adminDb.collection('blog_posts')
      .where('status', '==', 'draft');

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'No posts to publish', published: 0 });
    }

    // Filter to posts with publishDate <= now (or no publishDate = publish immediately)
    const duePosts = snapshot.docs.filter(doc => {
      const data = doc.data();
      if (data.framerSynced) return false; // Already synced
      if (!data.publishDate) return true; // No date = publish now
      return new Date(data.publishDate) <= new Date(now);
    });

    if (duePosts.length === 0) {
      return NextResponse.json({ success: true, message: 'No posts due for publishing', published: 0 });
    }

    // Dynamic import of framer-api (ESM)
    const { connect } = await import('framer-api');

    console.log(`[blog-publish] Connecting to Framer: ${framerProjectUrl}`);
    const framer = await connect(framerProjectUrl, framerApiKey);

    try {
      const collections = await framer.getCollections();
      const blogCollection = collections.find((c: any) =>
        (c.name || '').toLowerCase().includes('article') ||
        (c.name || '').toLowerCase().includes('blog') ||
        (c.name || '').toLowerCase().includes('post')
      );

      if (!blogCollection) {
        await framer.disconnect();
        return NextResponse.json({
          error: 'No blog/articles collection found in Framer CMS',
          collections: collections.map((c: any) => c.name || c.id),
        }, { status: 500 });
      }

      const fields = await blogCollection.getFields();
      const fieldMap: Record<string, string> = {};
      for (const f of fields) {
        const name = (f.name || '').toLowerCase().replace(/\s+/g, '');
        fieldMap[name] = f.id;
      }

      // Get existing slugs to avoid duplicates
      const existingItems = await blogCollection.getItems();
      const existingSlugs = new Set(existingItems.map((item: any) => item.slug));

      const results: { id: string; title: string; status: string }[] = [];

      for (const doc of duePosts) {
        const post = doc.data();

        if (existingSlugs.has(post.slug)) {
          // Mark as synced even if it already exists in Framer
          await adminDb.collection('blog_posts').doc(doc.id).update({
            framerSynced: true,
            framerSyncedAt: now,
          });
          results.push({ id: doc.id, title: post.title, status: 'already_in_framer' });
          continue;
        }

        // Build field data
        const fieldData: Record<string, any> = {};

        const titleFieldId = fieldMap.title || fieldMap.name || fieldMap.headline;
        if (titleFieldId) fieldData[titleFieldId] = post.title;

        const bodyFieldId = fieldMap.content || fieldMap.body || fieldMap.text || fieldMap.article;
        if (bodyFieldId) fieldData[bodyFieldId] = markdownToHtml(post.content);

        const excerptFieldId = fieldMap.excerpt || fieldMap.description || fieldMap.summary || fieldMap.subtitle;
        if (excerptFieldId) fieldData[excerptFieldId] = post.excerpt || '';

        const authorFieldId = fieldMap.author || fieldMap.writer;
        if (authorFieldId) fieldData[authorFieldId] = post.author || 'Yarn Digital';

        const dateFieldId = fieldMap.date || fieldMap.publishedat || fieldMap.publishdate || fieldMap.published;
        if (dateFieldId) fieldData[dateFieldId] = post.publishDate || post.publishedAt || now;

        const tagFieldId = fieldMap.tags || fieldMap.category || fieldMap.categories;
        if (tagFieldId && post.tags) {
          fieldData[tagFieldId] = Array.isArray(post.tags) ? post.tags.join(', ') : post.tags;
        }

        const metaTitleFieldId = fieldMap.metatitle || fieldMap.seotitle;
        if (metaTitleFieldId) fieldData[metaTitleFieldId] = post.metaTitle || post.title;

        const metaDescFieldId = fieldMap.metadescription || fieldMap.seodescription;
        if (metaDescFieldId) fieldData[metaDescFieldId] = post.metaDescription || post.excerpt || '';

        console.log(`[blog-publish] Publishing: "${post.title}" (${post.slug})`);

        await blogCollection.addItems([{
          slug: post.slug,
          draft: false,
          fieldData,
        }]);

        // Update Firestore
        await adminDb.collection('blog_posts').doc(doc.id).update({
          status: 'published',
          publishedAt: now,
          framerSynced: true,
          framerSyncedAt: now,
        });

        results.push({ id: doc.id, title: post.title, status: 'published' });
      }

      // Publish and deploy if we added anything new
      const newlyPublished = results.filter(r => r.status === 'published');
      if (newlyPublished.length > 0) {
        console.log(`[blog-publish] Publishing Framer preview...`);
        const publishResult = await framer.publish();
        console.log(`[blog-publish] Deploying to production...`);
        await framer.deploy(publishResult.deployment.id);
        console.log(`[blog-publish] ✅ Deployed`);
      }

      await framer.disconnect();

      return NextResponse.json({
        success: true,
        published: newlyPublished.length,
        skipped: results.filter(r => r.status === 'already_in_framer').length,
        results,
      });
    } catch (framerErr: any) {
      await framer.disconnect();
      throw framerErr;
    }
  } catch (error: any) {
    console.error('[blog-publish] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to publish blog posts',
    }, { status: 500 });
  }
}
