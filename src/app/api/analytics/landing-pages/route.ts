import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Landing page analytics — views, submissions, conversion rates.
 * Requires auth (dashboard use only).
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const jwtSecret = getJwtSecret();
    jwt.verify(token, jwtSecret);

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString().split('T')[0];
    const cutoffISO = cutoffDate.toISOString();

    // 1. Get page views
    const viewsSnapshot = await adminDb.collection('analytics_page_views')
      .where('date', '>=', cutoff)
      .get();

    const pageViews: Record<string, number> = {};
    viewsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const page = data.page;
      pageViews[page] = (pageViews[page] || 0) + (data.views || 0);
    });

    // 2. Get lead submissions by source
    const leadsSnapshot = await adminDb.collection('leads')
      .where('createdAt', '>=', cutoffISO)
      .get();

    const submissions: Record<string, number> = {};
    leadsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const source = data.source || 'unknown';
      submissions[source] = (submissions[source] || 0) + 1;
    });

    // 3. Build per-page stats
    const landingPages = [
      'free-audit', 'get-quote', 'free-review', 'free-consultation',
      'seo-audit', 'new-website', 'new-brand', 'shopify',
      'web-design-belfast', 'website-not-working', 'yarn-digital',
    ];

    const stats = landingPages.map(page => {
      const views = pageViews[page] || 0;
      const subs = submissions[page] || submissions[`landing-page-${page}`] || 0;
      const conversionRate = views > 0 ? ((subs / views) * 100) : 0;

      return {
        page,
        url: `/${page}`,
        views,
        submissions: subs,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    });

    // Sort by views descending
    stats.sort((a, b) => b.views - a.views);

    const totals = {
      totalViews: stats.reduce((sum, s) => sum + s.views, 0),
      totalSubmissions: stats.reduce((sum, s) => sum + s.submissions, 0),
      overallConversionRate: 0,
    };
    totals.overallConversionRate = totals.totalViews > 0
      ? Math.round(((totals.totalSubmissions / totals.totalViews) * 100) * 10) / 10
      : 0;

    return NextResponse.json({ stats, totals, days });
  } catch (error) {
    console.error('Landing page analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
