'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, MousePointerClick, PoundSterling, Users, Eye, BarChart3, ArrowRight } from 'lucide-react';

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

interface AdData {
  configured: boolean;
  platforms: {
    meta: { configured: boolean; error?: string };
    google: { configured: boolean; error?: string };
  };
  funnel: Record<string, FunnelStage>;
  metaFunnel: Record<string, FunnelStage>;
  googleFunnel: Record<string, FunnelStage>;
  campaigns: CampaignRow[];
  totals: { spend: number; clicks: number; leads: number; cpc: number; cpl: number };
  range: string;
}

const RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'mtd', label: 'MTD' },
];

const PLATFORMS = [
  { value: 'combined', label: 'Combined' },
  { value: 'meta', label: 'Meta' },
  { value: 'google', label: 'Google' },
];

const STAGE_KEYS = ['tofu', 'mofu', 'bofu'] as const;

const METRIC_KEYS = ['impressions', 'clicks', 'spend', 'cpc', 'ctr', 'landingPageViews', 'leads'] as const;
type MetricKey = typeof METRIC_KEYS[number];
const METRIC_LABELS: Record<MetricKey, string> = {
  impressions: 'Impressions', clicks: 'Clicks', spend: 'Spend',
  cpc: 'CPC', ctr: 'CTR', landingPageViews: 'LP Views', leads: 'Leads',
};

export function AdFunnelWidget() {
  const [data, setData] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState('7d');
  const [platform, setPlatform] = useState('combined');
  const [showCampaigns, setShowCampaigns] = useState(false);

  useEffect(() => { fetchData(); }, [range]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/ads?range=${range}`);
      const json = await res.json();
      if (res.ok) setData(json);
      else setError(json.error || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => n.toLocaleString();
  const fmtCurrency = (n: number) => `£${n.toFixed(2)}`;
  const fmtPct = (n: number) => `${n.toFixed(2)}%`;
  const formatMetric = (key: MetricKey, val: number): string => {
    if (key === 'spend' || key === 'cpc') return fmtCurrency(val);
    if (key === 'ctr') return fmtPct(val);
    return fmt(val);
  };

  // Efficiency colour coding
  const cpcColor = (cpc: number): string => {
    if (cpc === 0) return '#9CA3AF';
    if (cpc < 0.30) return '#22C55E';
    if (cpc <= 0.60) return '#F59E0B';
    return '#EF4444';
  };
  const ctrColor = (ctr: number): string => {
    if (ctr === 0) return '#9CA3AF';
    if (ctr >= 1) return '#22C55E';
    if (ctr >= 0.5) return '#F59E0B';
    return '#EF4444';
  };
  const leadsColor = (leads: number): string => leads > 0 ? '#22C55E' : '#9CA3AF';
  const metricColor = (key: MetricKey, val: number): string => {
    if (key === 'cpc') return cpcColor(val);
    if (key === 'ctr') return ctrColor(val);
    if (key === 'leads') return leadsColor(val);
    return '#374151';
  };

  const getFunnel = (): Record<string, FunnelStage> => {
    if (!data) return {};
    if (platform === 'meta') return data.metaFunnel;
    if (platform === 'google') return data.googleFunnel;
    return data.funnel;
  };

  const funnel = getFunnel();
  const stages = STAGE_KEYS.map(k => ({ key: k, ...(funnel[k] || { label: k, color: '#999', impressions: 0, reach: 0, clicks: 0, spend: 0, cpc: 0, ctr: 0, landingPageViews: 0, leads: 0 }) }));

  const maxImpressions = Math.max(...stages.map(s => s.impressions), 1);
  const maxClicks = Math.max(...stages.map(s => s.clicks), 1);

  const filteredCampaigns = data?.campaigns.filter(c => platform === 'combined' || c.platform === platform) || [];

  // Calculate totals for current platform view
  const viewTotals = {
    spend: stages.reduce((s, st) => s + st.spend, 0),
    clicks: stages.reduce((s, st) => s + st.clicks, 0),
    leads: stages.reduce((s, st) => s + st.leads, 0),
    impressions: stages.reduce((s, st) => s + st.impressions, 0),
    lpViews: stages.reduce((s, st) => s + st.landingPageViews, 0),
  };
  const viewCpc = viewTotals.clicks > 0 ? viewTotals.spend / viewTotals.clicks : 0;
  const viewCtr = viewTotals.impressions > 0 ? (viewTotals.clicks / viewTotals.impressions) * 100 : 0;

  const pillStyle = (active: boolean) => ({
    padding: '0.3rem 0.625rem',
    fontSize: '0.6875rem',
    fontWeight: 500 as const,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer' as const,
    backgroundColor: active ? '#FF3300' : '#F3F4F6',
    color: active ? '#fff' : '#6B7280',
    transition: 'all 0.15s',
  });

  const thStyle = {
    padding: '0.625rem 0.75rem',
    textAlign: 'right' as const,
    fontWeight: 500 as const,
    color: '#6B7280',
    fontSize: '0.6875rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const tdStyle = {
    padding: '0.625rem 0.75rem',
    textAlign: 'right' as const,
    fontWeight: 600 as const,
    color: '#374151',
    fontSize: '0.8125rem',
    fontVariantNumeric: 'tabular-nums' as const,
  };

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: '#FF3300' }} />
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>Ad Funnel Overview</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Platform toggle */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
            {PLATFORMS.map(p => (
              <button key={p.value} onClick={() => setPlatform(p.value)} style={pillStyle(platform === p.value)}>{p.label}</button>
            ))}
          </div>
          {/* Range toggle */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)} style={pillStyle(range === r.value)}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : !data ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>{error || 'Failed to load'}</div>
      ) : !data.configured ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem', margin: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>Ads not connected</p>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>Add META_ACCESS_TOKEN or Google Ads credentials to Vercel</p>
        </div>
      ) : (
        <>
          {/* Platform status badges */}
          {(data.platforms.meta.error || data.platforms.google.error) && (
            <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {data.platforms.meta.error && (
                <span style={{ fontSize: '0.6875rem', color: '#EF4444', backgroundColor: '#FEF2F2', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  Meta: {data.platforms.meta.error}
                </span>
              )}
              {data.platforms.google.error && (
                <span style={{ fontSize: '0.6875rem', color: '#F97316', backgroundColor: '#FFF7ED', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  Google: {data.platforms.google.error}
                </span>
              )}
            </div>
          )}

          {/* Funnel Bar Chart */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.875rem' }}>
              <BarChart3 size={13} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Funnel Performance {platform !== 'combined' ? `(${platform})` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {stages.map((stage) => {
                const impressionPct = (stage.impressions / maxImpressions) * 100;
                const clickPct = (stage.clicks / maxClicks) * 100;
                return (
                  <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '100px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stage.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151' }}>{stage.label.split(' (')[0]}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(impressionPct, 2)}%`, height: '100%', backgroundColor: stage.color, borderRadius: 3, opacity: 0.5, transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.625rem', color: '#9CA3AF', width: '55px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(stage.impressions)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(clickPct, 2)}%`, height: '100%', backgroundColor: stage.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.625rem', color: '#9CA3AF', width: '55px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(stage.clicks)} clicks</span>
                      </div>
                    </div>
                    <div style={{ width: '55px', textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: stage.color }}>{fmtCurrency(stage.spend)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Funnel Flow Dropoff */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FAFAFA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
              <ArrowRight size={13} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversion Flow</span>
            </div>
            {(() => {
              const steps = [
                { label: 'Impressions', value: viewTotals.impressions, color: '#6B7280' },
                { label: 'Clicks', value: viewTotals.clicks, color: '#3B82F6' },
                { label: 'LP Views', value: viewTotals.lpViews, color: '#8B5CF6' },
                { label: 'Leads', value: viewTotals.leads, color: '#22C55E' },
              ];
              const maxVal = Math.max(...steps.map(s => s.value), 1);
              return (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0', height: '80px' }}>
                  {steps.map((step, i) => {
                    const barHeight = Math.max((step.value / maxVal) * 100, 4);
                    const prevVal = i > 0 ? steps[i - 1].value : 0;
                    const dropoff = prevVal > 0 ? Math.round(((prevVal - step.value) / prevVal) * 100) : 0;
                    return (
                      <div key={step.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        {/* Dropoff label */}
                        {i > 0 && prevVal > 0 && (
                          <div style={{ fontSize: '0.5625rem', color: '#EF4444', fontWeight: 600, marginBottom: '0.125rem' }}>
                            -{dropoff}%
                          </div>
                        )}
                        {/* Value */}
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: step.color, fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(step.value)}
                        </div>
                        {/* Bar */}
                        <div style={{
                          width: '100%',
                          maxWidth: '100px',
                          height: `${barHeight}%`,
                          minHeight: '3px',
                          backgroundColor: step.color,
                          borderRadius: '4px 4px 0 0',
                          opacity: 0.8,
                          transition: 'height 0.5s ease',
                        }} />
                        {/* Label */}
                        <div style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: 500, marginTop: '0.25rem' }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '1.25rem' }}>Stage</th>
                  {METRIC_KEYS.map(m => <th key={m} style={thStyle}>{METRIC_LABELS[m]}</th>)}
                </tr>
              </thead>
              <tbody>
                {stages.map((stage, i) => (
                  <tr key={stage.key} style={{ borderBottom: i < stages.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stage.color }} />
                        <span style={{ fontSize: '0.8125rem' }}>{stage.label}</span>
                      </div>
                    </td>
                    {METRIC_KEYS.map(m => {
                      const val = stage[m as keyof typeof stage] as number;
                      return (
                        <td key={m} style={{ ...tdStyle, color: metricColor(m, val) }}>
                          {formatMetric(m, val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Totals */}
                <tr style={{ borderTop: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '1.25rem', fontWeight: 700 }}>Total</td>
                  <td style={tdStyle}>{fmt(viewTotals.impressions)}</td>
                  <td style={tdStyle}>{fmt(viewTotals.clicks)}</td>
                  <td style={tdStyle}>{fmtCurrency(viewTotals.spend)}</td>
                  <td style={tdStyle}>{fmtCurrency(viewCpc)}</td>
                  <td style={tdStyle}>{fmtPct(viewCtr)}</td>
                  <td style={tdStyle}>{fmt(viewTotals.lpViews)}</td>
                  <td style={{ ...tdStyle, color: leadsColor(viewTotals.leads), fontWeight: 700 }}>{fmt(viewTotals.leads)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Campaign Breakdown Toggle */}
          <div style={{ borderTop: '1px solid #E5E7EB' }}>
            <button
              onClick={() => setShowCampaigns(!showCampaigns)}
              style={{
                width: '100%', padding: '0.625rem 1.25rem', border: 'none', backgroundColor: 'transparent',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>Campaign Breakdown ({filteredCampaigns.length})</span>
              <span style={{ transform: showCampaigns ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {showCampaigns && filteredCampaigns.length > 0 && (
              <div style={{ overflowX: 'auto', borderTop: '1px solid #F3F4F6' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '1.25rem', minWidth: '180px' }}>Campaign</th>
                      <th style={{ ...thStyle, minWidth: '50px' }}>Platform</th>
                      <th style={thStyle}>Impr.</th>
                      <th style={thStyle}>Clicks</th>
                      <th style={thStyle}>Spend</th>
                      <th style={thStyle}>CPC</th>
                      <th style={thStyle}>CTR</th>
                      <th style={thStyle}>Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '1.25rem', fontWeight: 500, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', fontSize: '0.625rem', fontWeight: 600,
                            padding: '0.125rem 0.375rem', borderRadius: '4px',
                            backgroundColor: c.platform === 'meta' ? '#EBF5FF' : '#F0FDF4',
                            color: c.platform === 'meta' ? '#1877F2' : '#16A34A',
                          }}>
                            {c.platform === 'meta' ? 'META' : 'GADS'}
                          </span>
                        </td>
                        <td style={tdStyle}>{fmt(c.impressions)}</td>
                        <td style={tdStyle}>{fmt(c.clicks)}</td>
                        <td style={tdStyle}>{fmtCurrency(c.spend)}</td>
                        <td style={tdStyle}>{fmtCurrency(c.cpc)}</td>
                        <td style={tdStyle}>{fmtPct(c.ctr)}</td>
                        <td style={{ ...tdStyle, color: c.leads > 0 ? '#22C55E' : '#374151' }}>{fmt(c.leads)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #E5E7EB' }}>
            {[
              { icon: PoundSterling, label: 'Total Spend', value: fmtCurrency(viewTotals.spend), color: '#111827' },
              { icon: MousePointerClick, label: 'Total Clicks', value: fmt(viewTotals.clicks), color: '#111827' },
              { icon: Users, label: 'Total Leads', value: fmt(viewTotals.leads), color: leadsColor(viewTotals.leads) },
              { icon: Eye, label: 'Avg CPC', value: fmtCurrency(viewCpc), color: '#111827' },
            ].map((card, i) => (
              <div key={i} style={{ padding: '0.875rem', textAlign: 'center', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  <card.icon size={12} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: '0.625rem', color: '#9CA3AF', fontWeight: 500 }}>{card.label}</span>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: card.color, fontVariantNumeric: 'tabular-nums' }}>{card.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
