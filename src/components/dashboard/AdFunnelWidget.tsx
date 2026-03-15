'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, MousePointerClick, PoundSterling, Users, Eye } from 'lucide-react';

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

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '0.75rem',
      border: '1px solid #E5E7EB',
      padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
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
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : !data ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
          {error || 'Failed to load ad data'}
        </div>
      ) : !data.configured ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>Meta Ads not connected</p>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>Add META_ACCESS_TOKEN to Vercel env vars to see live data</p>
        </div>
      ) : (
        <>
          {/* Funnel Stages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {(['tofu', 'mofu', 'bofu'] as const).map((key) => {
              const stage = data.funnel[key];
              return (
                <div
                  key={key}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #E5E7EB',
                    borderLeft: `4px solid ${stage.color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>{stage.label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: stage.color }}>{fmtCurrency(stage.spend)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginBottom: '0.125rem' }}>Impressions</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{fmt(stage.impressions)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginBottom: '0.125rem' }}>Clicks</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{fmt(stage.clicks)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginBottom: '0.125rem' }}>CPC</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{fmtCurrency(stage.cpc)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginBottom: '0.125rem' }}>CTR</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{fmtPct(stage.ctr)}</div>
                    </div>
                    {stage.landingPageViews > 0 && (
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginBottom: '0.125rem' }}>LP Views</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{fmt(stage.landingPageViews)}</div>
                      </div>
                    )}
                    {stage.leads > 0 && (
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginBottom: '0.125rem' }}>Leads</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#22C55E' }}>{fmt(stage.leads)}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#F9FAFB',
            borderRadius: '0.5rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <PoundSterling size={14} style={{ color: '#9CA3AF' }} />
                <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>Total Spend</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{fmtCurrency(data.totals.spend)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <MousePointerClick size={14} style={{ color: '#9CA3AF' }} />
                <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>Total Clicks</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{fmt(data.totals.clicks)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <Users size={14} style={{ color: '#9CA3AF' }} />
                <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>Total Leads</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#22C55E' }}>{fmt(data.totals.leads)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <Eye size={14} style={{ color: '#9CA3AF' }} />
                <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>Avg CPC</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{fmtCurrency(data.totals.cpc)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
