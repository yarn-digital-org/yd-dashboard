import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/types';

/**
 * Devi AI webhook endpoint for Lead Radar social monitoring.
 * Receives leads from Devi AI (ddevi.com) covering LinkedIn, Twitter, Facebook, Reddit.
 *
 * Configure in Devi AI dashboard:
 *   Webhook URL: https://yd-dashboard.vercel.app/api/webhooks/devi
 *   Method: POST
 *   Auth: Bearer token via DEVI_WEBHOOK_SECRET env var
 *
 * Also accepts direct pushes from our own Nitter RSS cron and Apify actors
 * (same payload shape, source field differentiates).
 */

// Map Devi AI platform names to our internal source values
const PLATFORM_MAP: Record<string, string> = {
  linkedin: 'linkedin',
  twitter: 'twitter',
  x: 'twitter',
  facebook: 'facebook',
  reddit: 'reddit',
};

// Map source → contactMethod for our prospects schema
const SOURCE_TO_CONTACT_METHOD: Record<string, string> = {
  linkedin: 'linkedin',
  twitter: 'social',
  facebook: 'social',
  reddit: 'social',
};

function inferSector(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('restaurant') || lower.includes('café') || lower.includes('cafe') || lower.includes('food')) return 'Hospitality';
  if (lower.includes('physio') || lower.includes('dental') || lower.includes('clinic') || lower.includes('health')) return 'Healthcare';
  if (lower.includes('shop') || lower.includes('ecommerce') || lower.includes('retail') || lower.includes('shopify')) return 'E-commerce';
  if (lower.includes('solicitor') || lower.includes('legal') || lower.includes('law')) return 'Legal';
  if (lower.includes('estate agent') || lower.includes('property') || lower.includes('letting')) return 'Property';
  if (lower.includes('builder') || lower.includes('construction') || lower.includes('tradesman') || lower.includes('plumber')) return 'Trades';
  if (lower.includes('accountant') || lower.includes('bookkeep')) return 'Finance';
  return 'SMB';
}

function scoreIntent(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  const highSignals = ['looking for', 'recommend', 'need a', 'anyone know', 'can anyone suggest', 'who can', 'help me find', 'urgently need'];
  const medSignals = ['website', 'rebrand', 'seo', 'digital marketing', 'web design', 'online presence'];
  if (highSignals.some(s => lower.includes(s))) return 'high';
  if (medSignals.some(s => lower.includes(s))) return 'medium';
  return 'low';
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const webhookSecret = process.env.DEVI_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      if (token !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();

    // Devi AI sends either a single lead object or an array
    const leads: any[] = Array.isArray(body) ? body : body.leads ? body.leads : [body];

    if (!leads.length) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    // Resolve orgId — Lead Radar is org-scoped; use env var to pin to Yarn Digital org
    const orgId = process.env.YD_ORG_ID;
    if (!orgId) {
      return NextResponse.json({ error: 'YD_ORG_ID env var not set' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const results = { created: 0, skipped: 0, errors: 0 };

    for (const lead of leads) {
      try {
        // Normalise Devi AI payload fields
        // Devi sends: platform, post_url, post_text, author_name, author_url, author_bio, keyword, matched_at
        const platform = (lead.platform || lead.source || 'unknown').toLowerCase();
        const source = PLATFORM_MAP[platform] || platform;
        const postText = lead.post_text || lead.text || lead.content || '';
        const postUrl = lead.post_url || lead.url || lead.profile_url || '';
        const authorName = lead.author_name || lead.name || lead.username || 'Unknown';
        const authorBio = lead.author_bio || lead.bio || '';
        const keyword = lead.keyword || lead.matched_keyword || '';
        const matchedAt = lead.matched_at || lead.created_at || now;

        // Dedup check — skip if we already have this post URL
        if (postUrl) {
          const existing = await adminDb
            .collection(COLLECTIONS.OUTREACH_PROSPECTS)
            .where('userId', '==', orgId)
            .where('contactValue', '==', postUrl)
            .limit(1)
            .get();
          if (!existing.empty) {
            results.skipped++;
            continue;
          }
        }

        const intentScore = scoreIntent(postText);
        // Only capture high/medium intent leads to avoid noise
        if (intentScore === 'low') {
          results.skipped++;
          continue;
        }

        const sector = inferSector(postText + ' ' + authorBio);
        const contactMethod = SOURCE_TO_CONTACT_METHOD[source] || 'social';

        const prospect = {
          userId: orgId,
          company: authorName, // Best we can do from social; team can update
          sector,
          website: '', // Unknown from social post — leave blank for team to fill
          decisionMaker: authorName,
          decisionMakerTitle: null,
          contactMethod,
          contactValue: postUrl || lead.author_url || '',
          painPoint: postText.substring(0, 300),
          notes: `Source: ${source} | Keyword: ${keyword} | Intent: ${intentScore} | Bio: ${authorBio.substring(0, 150)} | Matched: ${matchedAt}`,
          status: 'identified',
          source,
          channel: platform === 'facebook' ? 'facebook_group' : source,
          intentScore,
          matchedKeyword: keyword,
          sourceUrl: postUrl,
          approvedAt: null,
          sentAt: null,
          repliedAt: null,
          createdAt: now,
          updatedAt: now,
        };

        await adminDb.collection(COLLECTIONS.OUTREACH_PROSPECTS).add(prospect);
        results.created++;
      } catch (leadErr: any) {
        console.error('Error processing lead:', leadErr.message, lead);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: leads.length,
      ...results,
    });
  } catch (error: any) {
    console.error('Devi webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
