import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';

/**
 * Ad Funnel Analytics — pulls from Meta Marketing API + Google Ads API
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

interface CampaignRow {
  name: string;
  platform: 'meta' | 'google';
  stage: string;
  impressions: number;
  clicks: number;
  spend: number;
  cpc: number;
  ctr: number;
  leads: number;
  landingPageViews: number;
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
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    since = d.toISOString().split('T')[0];
  }

  return { since, until };
}

function classifyCampaign(name: string): 'tofu' | 'mofu' | 'bofu' | 'unknown' {
  const lower = name.toLowerCase();
  if (lower.includes('awareness') || lower.includes('tofu') || lower.includes('brand awareness') || lower.includes('brand protection')) return 'tofu';
  if (lower.includes('consideration') || lower.includes('mofu') || lower.includes('traffic') || lower.includes('core services') || lower.includes('problem')) return 'mofu';
  if (lower.includes('lead') || lower.includes('bofu') || lower.includes('conversion')) return 'bofu';
  return 'unknown';
}

function createEmptyStages(): Record<string, FunnelStage> {
  return {
    tofu: { label: 'Awareness (TOFU)', color: '#EF4444', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
    mofu: { label: 'Consideration (MOFU)', color: '#F97316', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
    bofu: { label: 'Lead Gen (BOFU)', color: '#22C55E', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 },
  };
}

async function fetchMetaData(since: string, until: string): Promise<{ stages: Record<string, FunnelStage>; campaigns: CampaignRow[]; error?: string }> {
  const accessToken = (process.env.META_ACCESS_TOKEN || '').trim();
  let adAccountId = (process.env.META_AD_ACCOUNT_ID || 'act_1118539906224369').trim();
  if (!adAccountId.startsWith('act_')) adAccountId = `act_${adAccountId}`;

  if (!accessToken) {
    return { stages: createEmptyStages(), campaigns: [] };
  }

  const fields = 'campaign_name,impressions,reach,clicks,spend,cpc,ctr,actions';
  let authParams = `access_token=${accessToken}`;
  const appSecret = (process.env.META_APP_SECRET || '').trim();
  if (appSecret) {
    const crypto = await import('crypto');
    const proof = crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex');
    authParams += `&appsecret_proof=${proof}`;
  }

  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?` +
    `fields=${fields}&time_range=${timeRange}&level=campaign&limit=50&${authParams}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    return { stages: createEmptyStages(), campaigns: [], error: data.error.message };
  }

  const insights: CampaignInsight[] = data.data || [];
  const stages = createEmptyStages();
  const campaigns: CampaignRow[] = [];

  for (const insight of insights) {
    const stage = classifyCampaign(insight.campaign_name);
    const impressions = parseInt(insight.impressions || '0');
    const clicks = parseInt(insight.clicks || '0');
    const spend = parseFloat(insight.spend || '0');
    let lpViews = 0;
    let leads = 0;

    if (insight.actions) {
      for (const action of insight.actions) {
        if (action.action_type === 'landing_page_view') lpViews += parseInt(action.value);
        if (action.action_type === 'lead' || action.action_type === 'offsite_conversion.fb_pixel_lead') leads += parseInt(action.value);
      }
    }

    campaigns.push({
      name: insight.campaign_name,
      platform: 'meta',
      stage: stage === 'unknown' ? 'other' : stage,
      impressions, clicks, spend,
      cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
      leads, landingPageViews: lpViews,
    });

    if (stage !== 'unknown') {
      const s = stages[stage];
      s.impressions += impressions;
      s.reach += parseInt(insight.reach || '0');
      s.clicks += clicks;
      s.spend += spend;
      s.landingPageViews += lpViews;
      s.leads += leads;
    }
  }

  for (const key of Object.keys(stages)) {
    const s = stages[key];
    s.cpc = s.clicks > 0 ? Math.round((s.spend / s.clicks) * 100) / 100 : 0;
    s.ctr = s.impressions > 0 ? Math.round((s.clicks / s.impressions) * 10000) / 100 : 0;
  }

  return { stages, campaigns };
}

async function getGoogleAccessToken(): Promise<string | null> {
  const clientId = (process.env.GOOGLE_ADS_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_ADS_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.GOOGLE_ADS_REFRESH_TOKEN || '').trim();

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function fetchGoogleData(since: string, until: string): Promise<{ stages: Record<string, FunnelStage>; campaigns: CampaignRow[]; error?: string }> {
  const devToken = (process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '').trim();
  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').trim().replace(/-/g, '');
  const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').trim().replace(/-/g, '');

  if (!devToken || !customerId) {
    return { stages: createEmptyStages(), campaigns: [] };
  }

  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    return { stages: createEmptyStages(), campaigns: [], error: 'Failed to get Google access token' };
  }

  try {
    const query = `
      SELECT
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions
      FROM campaign
      WHERE segments.date BETWEEN '${since}' AND '${until}'
        AND campaign.status = 'ENABLED'
    `;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    };
    if (loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId;
    }

    const res = await fetch(
      `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error('Google Ads API error:', data.error);
      return { stages: createEmptyStages(), campaigns: [], error: data.error.message || 'Google Ads API error' };
    }

    // searchStream returns array of result batches
    const results = Array.isArray(data) ? data : [data];
    const stages = createEmptyStages();
    const campaigns: CampaignRow[] = [];

    for (const batch of results) {
      if (!batch.results) continue;
      for (const row of batch.results) {
        const name = row.campaign?.name || 'Unknown';
        const impressions = parseInt(row.metrics?.impressions || '0');
        const clicks = parseInt(row.metrics?.clicks || '0');
        const costMicros = parseInt(row.metrics?.costMicros || '0');
        const spend = costMicros / 1_000_000;
        const conversions = parseFloat(row.metrics?.conversions || '0');

        const stage = classifyCampaign(name);

        campaigns.push({
          name,
          platform: 'google',
          stage: stage === 'unknown' ? 'other' : stage,
          impressions, clicks, spend,
          cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
          ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
          leads: Math.round(conversions),
          landingPageViews: 0,
        });

        if (stage !== 'unknown') {
          const s = stages[stage];
          s.impressions += impressions;
          s.clicks += clicks;
          s.spend += spend;
          s.leads += Math.round(conversions);
        }
      }
    }

    for (const key of Object.keys(stages)) {
      const s = stages[key];
      s.cpc = s.clicks > 0 ? Math.round((s.spend / s.clicks) * 100) / 100 : 0;
      s.ctr = s.impressions > 0 ? Math.round((s.clicks / s.impressions) * 10000) / 100 : 0;
    }

    return { stages, campaigns };
  } catch (err) {
    console.error('Google Ads fetch error:', err);
    return { stages: createEmptyStages(), campaigns: [], error: 'Failed to fetch Google Ads data' };
  }
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
    const { since, until } = getDateRange(range);

    // Fetch both platforms in parallel
    const [meta, google] = await Promise.all([
      fetchMetaData(since, until),
      fetchGoogleData(since, until),
    ]);

    // Merge funnel stages
    const combined = createEmptyStages();
    for (const key of Object.keys(combined)) {
      const m = meta.stages[key];
      const g = google.stages[key];
      const c = combined[key];
      c.impressions = m.impressions + g.impressions;
      c.reach = m.reach + g.reach;
      c.clicks = m.clicks + g.clicks;
      c.spend = Math.round((m.spend + g.spend) * 100) / 100;
      c.landingPageViews = m.landingPageViews + g.landingPageViews;
      c.leads = m.leads + g.leads;
      c.cpc = c.clicks > 0 ? Math.round((c.spend / c.clicks) * 100) / 100 : 0;
      c.ctr = c.impressions > 0 ? Math.round((c.clicks / c.impressions) * 10000) / 100 : 0;
    }

    const totalSpend = Object.values(combined).reduce((sum, s) => sum + s.spend, 0);
    const totalClicks = Object.values(combined).reduce((sum, s) => sum + s.clicks, 0);
    const totalLeads = Object.values(combined).reduce((sum, s) => sum + s.leads, 0);

    // All campaigns for breakdown table
    const allCampaigns = [...meta.campaigns, ...google.campaigns]
      .sort((a, b) => b.spend - a.spend);

    const metaConfigured = !!(process.env.META_ACCESS_TOKEN || '').trim();
    const googleConfigured = !!(process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '').trim();

    return NextResponse.json({
      configured: metaConfigured || googleConfigured,
      platforms: {
        meta: { configured: metaConfigured, error: meta.error },
        google: { configured: googleConfigured, error: google.error },
      },
      funnel: combined,
      metaFunnel: meta.stages,
      googleFunnel: google.stages,
      campaigns: allCampaigns,
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
