import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Public analytics endpoint — tracks page views for landing pages.
 * POST { page, referrer?, utm_source?, utm_medium?, utm_campaign? }
 * GET ?page=xxx — returns view count for a specific page (internal use)
 */

// Simple rate limit — 30 views per IP per minute
const viewLog = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = viewLog.get(ip);
  if (!entry || now > entry.resetAt) {
    viewLog.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  entry.count++;
  return entry.count > 30;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: true }); // Silent drop
    }

    if (!adminDb) {
      return NextResponse.json({ ok: true });
    }

    const body = await request.json();
    const page = String(body.page || '').replace(/[^a-zA-Z0-9\-\/]/g, '').slice(0, 100);
    if (!page) {
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Increment daily counter (atomic)
    const counterRef = adminDb.collection('analytics_page_views').doc(`${page}__${dateKey}`);
    const { FieldValue } = await import('firebase-admin/firestore');

    await counterRef.set({
      page,
      date: dateKey,
      views: FieldValue.increment(1),
      lastViewAt: now.toISOString(),
      ...(body.referrer ? { lastReferrer: String(body.referrer).slice(0, 500) } : {}),
      ...(body.utm_source ? { lastUtmSource: String(body.utm_source).slice(0, 100) } : {}),
      ...(body.utm_campaign ? { lastUtmCampaign: String(body.utm_campaign).slice(0, 100) } : {}),
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never fail client-side
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    let query: FirebaseFirestore.Query = adminDb.collection('analytics_page_views')
      .where('date', '>=', cutoff);

    if (page) {
      query = adminDb.collection('analytics_page_views')
        .where('page', '==', page)
        .where('date', '>=', cutoff);
    }

    const snapshot = await query.get();
    
    // Aggregate by page
    const pageStats: Record<string, { views: number; dailyViews: Record<string, number> }> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const p = data.page;
      if (!pageStats[p]) {
        pageStats[p] = { views: 0, dailyViews: {} };
      }
      pageStats[p].views += data.views || 0;
      pageStats[p].dailyViews[data.date] = data.views || 0;
    });

    return NextResponse.json({ stats: pageStats, days });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
