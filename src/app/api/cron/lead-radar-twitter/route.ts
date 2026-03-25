import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/types';

/**
 * GET /api/cron/lead-radar-twitter
 *
 * Polls Nitter RSS feeds for Belfast/NI business keyword searches.
 * Runs every 6 hours via Vercel Cron.
 * Zero-cost Twitter monitoring using public Nitter instances.
 *
 * If Nitter instances are unavailable, falls back gracefully (no errors, just empty results).
 * Upgrade path: swap fetch URLs for Apify actor calls when budget allows.
 *
 * Add to vercel.json crons:
 *   { "path": "/api/cron/lead-radar-twitter", "schedule": "0 every-6h * * *" }
 *
 * Protected by CRON_SECRET header.
 */

const KEYWORDS = [
  'need a website Belfast',
  'web designer Northern Ireland',
  'website redesign Belfast',
  'recommend web design Belfast',
  'rebranding Northern Ireland',
  'digital marketing Belfast',
  'SEO Belfast',
];

// Public Nitter instances — try each in order until one responds
const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.poast.org',
  'https://nitter.1d4.us',
];

function inferSector(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('restaurant') || lower.includes('café') || lower.includes('food')) return 'Hospitality';
  if (lower.includes('physio') || lower.includes('dental') || lower.includes('health')) return 'Healthcare';
  if (lower.includes('shop') || lower.includes('ecommerce') || lower.includes('shopify')) return 'E-commerce';
  if (lower.includes('estate agent') || lower.includes('property')) return 'Property';
  if (lower.includes('builder') || lower.includes('construction') || lower.includes('trades')) return 'Trades';
  return 'SMB';
}

function scoreIntent(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  const highSignals = ['looking for', 'recommend', 'need a', 'anyone know', 'can anyone', 'help me find'];
  const medSignals = ['website', 'rebrand', 'seo', 'digital marketing', 'web design'];
  if (highSignals.some(s => lower.includes(s))) return 'high';
  if (medSignals.some(s => lower.includes(s))) return 'medium';
  return 'low';
}

// Simple RSS XML parser — extracts <item> blocks
function parseRssItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string; author: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string; author: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const get = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    items.push({
      title: get('title'),
      link: get('link'),
      description: get('description').replace(/<[^>]+>/g, ' ').trim(),
      pubDate: get('pubDate'),
      author: get('dc:creator') || get('author') || '',
    });
  }
  return items;
}

async function fetchNitterRss(keyword: string): Promise<Array<{ title: string; link: string; description: string; pubDate: string; author: string }>> {
  const encoded = encodeURIComponent(keyword);
  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `${instance}/search/rss?q=${encoded}&f=tweets`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'YarnDigital-LeadRadar/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes('<item>')) continue;
      return parseRssItems(xml);
    } catch {
      // Try next instance
      continue;
    }
  }
  return []; // All instances failed — cron completes cleanly
}

export async function GET(request: NextRequest) {
  try {
  // Auth
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const orgId = process.env.YD_ORG_ID;
  if (!orgId) {
    return NextResponse.json({ error: 'YD_ORG_ID env var not set' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const stats = { found: 0, created: 0, skipped: 0, errors: 0 };

  for (const keyword of KEYWORDS) {
    try {
      const items = await fetchNitterRss(keyword);
      stats.found += items.length;

      for (const item of items.slice(0, 20)) { // Cap at 20 per keyword per run
        try {
          const intentScore = scoreIntent(item.title + ' ' + item.description);
          if (intentScore === 'low') {
            stats.skipped++;
            continue;
          }

          // Dedup by tweet URL
          if (item.link) {
            const existing = await adminDb
              .collection(COLLECTIONS.OUTREACH_PROSPECTS)
              .where('userId', '==', orgId)
              .where('sourceUrl', '==', item.link)
              .limit(1)
              .get();
            if (!existing.empty) {
              stats.skipped++;
              continue;
            }
          }

          const postText = item.title + ' ' + item.description;
          const sector = inferSector(postText);

          await adminDb.collection(COLLECTIONS.OUTREACH_PROSPECTS).add({
            userId: orgId,
            company: item.author || 'Unknown',
            sector,
            website: '',
            decisionMaker: item.author || 'Unknown',
            decisionMakerTitle: null,
            contactMethod: 'social',
            contactValue: item.link || '',
            painPoint: (item.title || item.description).substring(0, 300),
            notes: `Source: twitter (Nitter RSS) | Keyword: ${keyword} | Intent: ${intentScore} | Published: ${item.pubDate}`,
            status: 'identified',
            source: 'twitter',
            channel: 'twitter',
            intentScore,
            matchedKeyword: keyword,
            sourceUrl: item.link || null,
            approvedAt: null,
            sentAt: null,
            repliedAt: null,
            createdAt: now,
            updatedAt: now,
          });
          stats.created++;
        } catch (itemErr: any) {
          console.error('Error saving tweet lead:', itemErr.message);
          stats.errors++;
        }
      }
    } catch (kwErr: any) {
      console.error('Error fetching Nitter for keyword:', keyword, kwErr.message);
      stats.errors++;
    }
  }

  console.log('Lead Radar Twitter cron complete:', stats);
  return NextResponse.json({ success: true, ...stats });
  } catch (err: any) {
    console.error('Lead Radar Twitter cron fatal error:', err.message);
    return NextResponse.json({ error: 'Cron failed', details: err.message }, { status: 500 });
  }
}
