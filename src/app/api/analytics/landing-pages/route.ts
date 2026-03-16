import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-middleware';

const LANDING_PAGES = [
  'free-audit', 'web-design-belfast', 'website-not-working', 'yarn-digital',
  'free-consultation', 'free-review', 'seo-belfast', 'seo-audit',
  'get-quote', 'new-website', 'new-brand', 'shopify',
];

export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request);

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const date7d = new Date(now);
    date7d.setDate(date7d.getDate() - 7);
    const cutoff7d = date7d.toISOString().split('T')[0];

    const date30d = new Date(now);
    date30d.setDate(date30d.getDate() - 30);
    const cutoff30d = date30d.toISOString().split('T')[0];

    // Fetch all page view docs from the last 30 days
    const snapshot = await adminDb
      .collection('analytics_page_views')
      .where('date', '>=', cutoff30d)
      .get();

    // Aggregate views per page
    const pageViews: Record<string, { views_today: number; views_7d: number; views_30d: number }> = {};
    for (const page of LANDING_PAGES) {
      pageViews[page] = { views_today: 0, views_7d: 0, views_30d: 0 };
    }

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const page = data.page as string;
      const date = data.date as string;
      const views = (data.views as number) || 0;

      // Check if this page matches any landing page (exact or contains)
      const matchedPage = LANDING_PAGES.find(lp => page === lp || page.includes(lp));
      if (!matchedPage) return;

      if (!pageViews[matchedPage]) {
        pageViews[matchedPage] = { views_today: 0, views_7d: 0, views_30d: 0 };
      }

      if (date === today) {
        pageViews[matchedPage].views_today += views;
      }
      if (date >= cutoff7d) {
        pageViews[matchedPage].views_7d += views;
      }
      pageViews[matchedPage].views_30d += views;
    });

    // Count leads per source/page
    const leadsSnapshot = await adminDb.collection('leads').get();
    const leadsPerPage: Record<string, number> = {};

    leadsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const source = (data.source as string) || '';
      const utmSource = data.utm?.source as string || '';
      const utmCampaign = data.utm?.campaign as string || '';

      // Try to match lead to a landing page
      const candidates = [source, utmSource, utmCampaign].filter(Boolean);
      for (const candidate of candidates) {
        const matchedPage = LANDING_PAGES.find(lp =>
          candidate.toLowerCase().includes(lp.toLowerCase())
        );
        if (matchedPage) {
          leadsPerPage[matchedPage] = (leadsPerPage[matchedPage] || 0) + 1;
          break;
        }
      }
    });

    // Build result
    const pages = LANDING_PAGES.map(page => {
      const views = pageViews[page] || { views_today: 0, views_7d: 0, views_30d: 0 };
      const leads = leadsPerPage[page] || 0;
      const convRate = views.views_30d > 0 ? (leads / views.views_30d) * 100 : 0;

      return {
        page,
        views_today: views.views_today,
        views_7d: views.views_7d,
        views_30d: views.views_30d,
        leads,
        conv_rate: Math.round(convRate * 100) / 100,
      };
    }).sort((a, b) => b.views_30d - a.views_30d);

    return NextResponse.json({ pages });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const msg = (error as { message: string }).message;
      if (msg.includes('Unauthorized') || msg.includes('expired') || msg.includes('Invalid')) {
        return NextResponse.json({ error: msg }, { status: 401 });
      }
    }
    console.error('Landing pages analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
