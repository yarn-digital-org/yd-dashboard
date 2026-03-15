'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, MousePointerClick, PoundSterling, Users, Eye, BarChart3 } from 'lucide-react';

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

interface AdData {
  configured: boolean;
  message?: string;
  funnel: {
    tofu: FunnelStage;
    mofu: FunnelStage;
    bofu: FunnelStage;
  };
  totals: {
    spend: number;
    clicks: number;
    leads: number;
    cpc: number;
    cpl: number;
  };
  range: string;
}

const RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'mtd', label: 'Month to Date' },
];

const METRICS = ['impressions', 'clicks', 'spend', 'cpc', 'ctr', 'landingPageViews', 'leads'] as const;

type MetricKey = typeof METRICS[number];

const METRIC_LABELS: Record<MetricKey, string> = {
  impressions: 'Impressions',
  clicks: 'Clicks',
  spend: 'Spend',
  cpc: 'CPC',
  ctr: 'CTR',
  landingPageViews: 'LP Views',
  leads: 'Leads',
};

export function AdFunnelWidget() {
  const [data, setData] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState('7d');

  useEffect(() => {
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/ads?range=${range}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || 'Failed to load');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString();
  const fmtCurrency = (n: number) => `£${n.toFixed(2)}`;
  const fmtPct = (n: number) => `${n.toFixed(2)}%`;

  const formatMetric = (key: MetricKey, val: number): string => {
    if (key === 'spend' || key === 'cpc') return fmtCurrency(val);
    if (key === 'ctr') return fmtPct(val);
    return fmt(val);
  };

  const stages = data ? [
    { key: 'tofu', ...data.funnel.tofu },
    { key: 'mofu', ...data.funnel.mofu },
    { key: 'bofu', ...data.funnel.bofu },
  ] : [];

  // Find max values for bar chart scaling
  const maxImpressions = Math.max(...stages.map(s => s.impressions), 1);
  const maxClicks = Math.max(...stages.map(s => s.clicks), 1);
  const maxSpend = Math.max(...stages.map(s => s.spend), 1);

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '0.75rem',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} style={{ color: '#FF3300' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Ad Funnel Overview</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: range === r.value ? '#FF3300' : '#F3F4F6',
                color: range === r.value ? '#fff' : '#6B7280',
                transition: 'all 0.15s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : !data ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
          {error || 'Failed to load ad data'}
        </div>
      ) : !data.configured ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem', margin: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>Meta Ads not connected</p>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>Add META_ACCESS_TOKEN to Vercel env vars to see live data</p>
        </div>
      ) : (
        <>
          {/* Funnel Bar Chart */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
              <BarChart3 size={14} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Funnel Performance</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stages.map((stage) => {
                const impressionPct = (stage.impressions / maxImpressions) * 100;
                const clickPct = (stage.clicks / maxClicks) * 100;
                const spendPct = (stage.spend / maxSpend) * 100;
                return (
                  <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '120px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stage.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151' }}>{stage.label.split(' (')[0]}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {/* Impressions bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.max(impressionPct, 2)}%`,
                            height: '100%',
                            backgroundColor: stage.color,
                            borderRadius: 3,
                            opacity: 0.7,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: '#9CA3AF', width: '60px', textAlign: 'right' }}>{fmt(stage.impressions)}</span>
                      </div>
                      {/* Clicks bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.max(clickPct, 2)}%`,
                            height: '100%',
                            backgroundColor: stage.color,
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: '#9CA3AF', width: '60px', textAlign: 'right' }}>{fmt(stage.clicks)} clicks</span>
                      </div>
                    </div>
                    <div style={{ width: '60px', textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: stage.color }}>{fmtCurrency(stage.spend)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Bar legend */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', paddingLeft: '136px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: 16, height: 4, backgroundColor: '#9CA3AF', borderRadius: 2, opacity: 0.5 }} />
                <span style={{ fontSize: '0.625rem', color: '#9CA3AF' }}>Impressions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: 16, height: 4, backgroundColor: '#9CA3AF', borderRadius: 2 }} />
                <span style={{ fontSize: '0.625rem', color: '#9CA3AF' }}>Clicks</span>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontWeight: 500, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stage</th>
                  {METRICS.map((m) => (
                    <th key={m} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 500, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{METRIC_LABELS[m]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stages.map((stage, i) => (
                  <tr key={stage.key} style={{ borderBottom: i < stages.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500, color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: stage.color }} />
                        {stage.label}
                      </div>
                    </td>
                    {METRICS.map((m) => {
                      const val = stage[m as keyof typeof stage] as number;
                      const isHighlight = m === 'leads' && val > 0;
                      return (
                        <td key={m} style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: isHighlight ? '#22C55E' : '#374151',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {formatMetric(m, val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Totals Row */}
                <tr style={{ borderTop: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                  <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#111827' }}>Total</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(stages.reduce((s, st) => s + st.impressions, 0))}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(data.totals.clicks)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtCurrency(data.totals.spend)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtCurrency(data.totals.cpc)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtPct(data.totals.clicks > 0 ? (data.totals.clicks / stages.reduce((s, st) => s + st.impressions, 0)) * 100 : 0)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(stages.reduce((s, st) => s + st.landingPageViews, 0))}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: data.totals.leads > 0 ? '#22C55E' : '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(data.totals.leads)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0',
            borderTop: '1px solid #E5E7EB',
          }}>
            {[
              { icon: PoundSterling, label: 'Total Spend', value: fmtCurrency(data.totals.spend), color: '#111827' },
              { icon: MousePointerClick, label: 'Total Clicks', value: fmt(data.totals.clicks), color: '#111827' },
              { icon: Users, label: 'Total Leads', value: fmt(data.totals.leads), color: data.totals.leads > 0 ? '#22C55E' : '#111827' },
              { icon: Eye, label: 'Avg CPC', value: fmtCurrency(data.totals.cpc), color: '#111827' },
            ].map((card, i) => (
              <div key={i} style={{
                padding: '1rem',
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid #F3F4F6' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.375rem' }}>
                  <card.icon size={13} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 500 }}>{card.label}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: card.color, fontVariantNumeric: 'tabular-nums' }}>{card.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
