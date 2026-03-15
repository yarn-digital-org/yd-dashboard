import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';

/**
 * Ad Funnel Analytics — pulls from Meta Marketing API
 * GET /api/analytics/ads?range=7d|30d|mtd
 */

interface CampaignInsight {
  campaign_name: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  cpc: string;
  ctr: string;
  actions?: Array<{ action_type: string; value: string }>;
}

interface FunnelStage {
  label: string;
  color: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  cpc: number;
  ctr: number;
  landingPageViews: number;
  leads: number;
}

function getDateRange(range: string): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().split('T')[0];
  let since: string;

  if (range === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    since = d.toISOString().split('T')[0];
  } else if (range === 'mtd') {
    since = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  } else {
    // Default 7d
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    since = d.toISOString().split('T')[0];
  }

  return { since, until };
}

function classifyCampaign(name: string): 'tofu' | 'mofu' | 'bofu' | 'unknown' {
  const lower = name.toLowerCase();
  if (lower.includes('awareness') || lower.includes('tofu') || lower.includes('brand awareness')) return 'tofu';
  if (lower.includes('consideration') || lower.includes('mofu') || lower.includes('traffic')) return 'mofu';
  if (lower.includes('lead') || lower.includes('bofu') || lower.includes('conversion')) return 'bofu';
  return 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const jwtSecret = getJwtSecret();
    jwt.verify(token, jwtSecret);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID || 'act_1118539906224369';

    if (!accessToken) {
      // Return mock/empty data when not configured
      return NextResponse.json({
        configured: false,
        message: 'META_ACCESS_TOKEN not configured',
        funnel: {
          tofu: { label: 'Awareness (TOFU)', color: '#EF4444', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
          mofu: { label: 'Consideration (MOFU)', color: '#F97316', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
          bofu: { label: 'Lead Gen (BOFU)', color: '#22C55E', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
        },
        totals: { spend: 0, clicks: 0, leads: 0, cpc: 0, cpl: 0 },
        range,
      });
    }

    const { since, until } = getDateRange(range);

    // Fetch campaign insights from Meta Marketing API
    const fields = 'campaign_name,impressions,reach,clicks,spend,cpc,ctr,actions';
    
    // Build URL with appsecret_proof if META_APP_SECRET is set
    let authParams = `access_token=${accessToken}`;
    const appSecret = process.env.META_APP_SECRET;
    if (appSecret) {
      const crypto = await import('crypto');
      const proof = crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex');
      authParams += `&appsecret_proof=${proof}`;
    }
    
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?` +
      `fields=${fields}` +
      `&time_range={"since":"${since}","until":"${until}"}` +
      `&level=campaign` +
      `&limit=50` +
      `&${authParams}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('Meta API error:', data.error);
      return NextResponse.json({ error: data.error.message || 'Meta API error' }, { status: 502 });
    }

    const insights: CampaignInsight[] = data.data || [];

    // Classify and aggregate by funnel stage
    const stages: Record<string, FunnelStage> = {
      tofu: { label: 'Awareness (TOFU)', color: '#EF4444', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
      mofu: { label: 'Consideration (MOFU)', color: '#F97316', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
      bofu: { label: 'Lead Gen (BOFU)', color: '#22C55E', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
    };

    for (const insight of insights) {
      const stage = classifyCampaign(insight.campaign_name);
      if (stage === 'unknown') continue;

      const s = stages[stage];
      s.impressions += parseInt(insight.impressions || '0');
      s.reach += parseInt(insight.reach || '0');
      s.clicks += parseInt(insight.clicks || '0');
      s.spend += parseFloat(insight.spend || '0');

      // Extract actions
      if (insight.actions) {
        for (const action of insight.actions) {
          if (action.action_type === 'landing_page_view') {
            s.landingPageViews += parseInt(action.value);
          }
          if (action.action_type === 'lead' || action.action_type === 'offsite_conversion.fb_pixel_lead') {
            s.leads += parseInt(action.value);
          }
        }
      }
    }

    // Calculate derived metrics
    for (const key of Object.keys(stages)) {
      const s = stages[key];
      s.cpc = s.clicks > 0 ? Math.round((s.spend / s.clicks) * 100) / 100 : 0;
      s.ctr = s.impressions > 0 ? Math.round((s.clicks / s.impressions) * 10000) / 100 : 0;
    }

    const totalSpend = Object.values(stages).reduce((sum, s) => sum + s.spend, 0);
    const totalClicks = Object.values(stages).reduce((sum, s) => sum + s.clicks, 0);
    const totalLeads = Object.values(stages).reduce((sum, s) => sum + s.leads, 0);

    return NextResponse.json({
      configured: true,
      funnel: stages,
      totals: {
        spend: Math.round(totalSpend * 100) / 100,
        clicks: totalClicks,
        leads: totalLeads,
        cpc: totalClicks > 0 ? Math.round((totalSpend / totalClicks) * 100) / 100 : 0,
        cpl: totalLeads > 0 ? Math.round((totalSpend / totalLeads) * 100) / 100 : 0,
      },
      range,
    });
  } catch (error) {
    console.error('Ads analytics error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch ad analytics: ${message}` }, { status: 500 });
  }
}
