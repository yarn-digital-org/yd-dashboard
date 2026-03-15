import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-middleware';

/**
 * GET /api/landing-pages/[id]/analytics
 * Returns analytics summary + daily breakdown for a landing page.
 *
 * Summary: total views, leads, conversion rate, top UTM sources
 * Daily: views + leads per day for last 30 days
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    const { id } = await params;

    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    // Verify ownership
    const pageDoc = await adminDb.collection('landingPages').doc(id).get();
    if (!pageDoc.exists || pageDoc.data()?.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const pageData = pageDoc.data()!;

    // Fetch pageview events (last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const viewsSnap = await adminDb
      .collection('lp_analytics')
      .where('pageId', '==', id)
      .where('type', '==', 'view')
      .where('timestamp', '>=', sinceIso)
      .orderBy('timestamp', 'desc')
      .limit(2000)
      .get();

    const leadsSnap = await adminDb
      .collection('lp_analytics')
      .where('pageId', '==', id)
      .where('type', '==', 'lead')
      .where('timestamp', '>=', sinceIso)
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    const viewEvents = viewsSnap.docs.map(d => d.data());
    const leadEvents = leadsSnap.docs.map(d => d.data());

    // ── Daily breakdown ─────────────────────────────────────────────────────
    const dailyMap: Record<string, { views: number; leads: number }> = {};

    // Initialise last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { views: 0, leads: 0 };
    }

    for (const e of viewEvents) {
      const key = (e.timestamp as string)?.slice(0, 10);
      if (key && dailyMap[key]) dailyMap[key].views++;
    }
    for (const e of leadEvents) {
      const key = (e.timestamp as string)?.slice(0, 10);
      if (key && dailyMap[key]) dailyMap[key].leads++;
    }

    const daily = Object.entries(dailyMap).map(([date, stats]) => ({ date, ...stats }));

    // ── UTM source breakdown ────────────────────────────────────────────────
    const utmMap: Record<string, number> = {};
    for (const e of viewEvents) {
      const src = (e.utmSource as string) || 'direct';
      utmMap[src] = (utmMap[src] || 0) + 1;
    }
    const topSources = Object.entries(utmMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([source, count]) => ({ source, count }));

    // ── Device breakdown ────────────────────────────────────────────────────
    let mobile = 0, desktop = 0;
    for (const e of viewEvents) {
      if (e.isMobile) mobile++; else desktop++;
    }

    // ── A/B variant breakdown ───────────────────────────────────────────────
    const variantViews: Record<string, number> = {};
    const variantLeads: Record<string, number> = {};
    for (const e of viewEvents) {
      const vid = (e.variantId as string) || 'control';
      variantViews[vid] = (variantViews[vid] || 0) + 1;
    }
    for (const e of leadEvents) {
      const vid = (e.variantId as string) || 'control';
      variantLeads[vid] = (variantLeads[vid] || 0) + 1;
    }
    const variantIds = Array.from(new Set([...Object.keys(variantViews), ...Object.keys(variantLeads)]));
    const variantBreakdown = variantIds.map(vid => {
      const vViews = variantViews[vid] || 0;
      const vLeads = variantLeads[vid] || 0;
      return {
        variantId: vid,
        views: vViews,
        leads: vLeads,
        conversionRate: vViews > 0 ? parseFloat(((vLeads / vViews) * 100).toFixed(1)) : 0,
      };
    }).sort((a, b) => b.views - a.views);

    // Map variant labels from page data if available
    const pageVariants: Array<{ id: string; label: string }> = (pageData.variants as any[]) || [];
    const labelMap: Record<string, string> = {};
    for (const v of pageVariants) labelMap[v.id] = v.label;
    const variantBreakdownLabelled = variantBreakdown.map(v => ({
      ...v,
      label: labelMap[v.variantId] || v.variantId,
    }));

    // ── Summary ─────────────────────────────────────────────────────────────
    const totalViews = pageData.views || viewEvents.length;
    const totalLeads = pageData.leads || leadEvents.length;
    const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      data: {
        summary: {
          totalViews,
          totalLeads,
          conversionRate: parseFloat(conversionRate),
          last30DaysViews: viewEvents.length,
          last30DaysLeads: leadEvents.length,
        },
        daily,
        topSources,
        devices: { mobile, desktop },
        variants: variantBreakdownLabelled,
        abTestEnabled: !!(pageData.abTestEnabled) || pageVariants.length > 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
