'use client';

import { useState, useEffect } from 'react';
import { Loader2, BarChart3, Eye, Users, TrendingUp } from 'lucide-react';

interface PageStats {
  page: string;
  views_today: number;
  views_7d: number;
  views_30d: number;
  leads: number;
  conv_rate: number;
}

const formatPageName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function LandingPageAnalyticsWidget() {
  const [pages, setPages] = useState<PageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/landing-pages');
      const json = await res.json();
      if (res.ok) {
        setPages(json.pages || []);
      } else {
        setError(json.error || 'Failed to load');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const totalViews7d = pages.reduce((s, p) => s + p.views_7d, 0);
  const totalViews30d = pages.reduce((s, p) => s + p.views_30d, 0);
  const totalLeads = pages.reduce((s, p) => s + p.leads, 0);
  const avgConvRate = totalViews30d > 0 ? (totalLeads / totalViews30d) * 100 : 0;

  const thStyle: React.CSSProperties = {
    padding: '0.625rem 0.75rem',
    textAlign: 'right',
    fontWeight: 500,
    color: '#6B7280',
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.625rem 0.75rem',
    textAlign: 'right',
    fontWeight: 600,
    color: '#374151',
    fontSize: '0.8125rem',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} style={{ color: '#FF3300' }} />
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>Landing Page Analytics</h3>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>{error}</div>
      ) : (
        <>
          {/* Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '1.25rem' }}>Page</th>
                  <th style={thStyle}>Views (7d)</th>
                  <th style={thStyle}>Views (30d)</th>
                  <th style={thStyle}>Leads</th>
                  <th style={thStyle}>Conv Rate</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page, i) => (
                  <tr key={page.page} style={{ borderBottom: i < pages.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '1.25rem', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatPageName(page.page)}
                    </td>
                    <td style={tdStyle}>{page.views_7d.toLocaleString()}</td>
                    <td style={tdStyle}>{page.views_30d.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: page.leads > 0 ? '#22C55E' : '#9CA3AF' }}>{page.leads}</td>
                    <td style={{ ...tdStyle, color: page.conv_rate > 0 ? (page.conv_rate >= 5 ? '#22C55E' : page.conv_rate >= 2 ? '#F59E0B' : '#374151') : '#9CA3AF' }}>
                      {page.conv_rate > 0 ? `${page.conv_rate.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
                {/* Totals */}
                <tr style={{ borderTop: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '1.25rem', fontWeight: 700 }}>Total</td>
                  <td style={tdStyle}>{totalViews7d.toLocaleString()}</td>
                  <td style={tdStyle}>{totalViews30d.toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: totalLeads > 0 ? '#22C55E' : '#374151', fontWeight: 700 }}>{totalLeads}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{avgConvRate > 0 ? `${avgConvRate.toFixed(1)}%` : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #E5E7EB' }}>
            {[
              { icon: Eye, label: 'Views (7d)', value: totalViews7d.toLocaleString() },
              { icon: Users, label: 'Total Leads', value: totalLeads.toString() },
              { icon: TrendingUp, label: 'Avg Conv Rate', value: avgConvRate > 0 ? `${avgConvRate.toFixed(1)}%` : '—' },
            ].map((card, i) => (
              <div key={i} style={{ padding: '0.875rem', textAlign: 'center', borderRight: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  <card.icon size={12} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: '0.625rem', color: '#9CA3AF', fontWeight: 500 }}>{card.label}</span>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{card.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
