'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  HardDrive,
  RefreshCw,
  Search,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Download,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: number;
}

const MIME_LABELS: Record<string, string> = {
  'application/vnd.google-apps.document': 'Google Doc',
  'application/vnd.google-apps.spreadsheet': 'Google Sheet',
  'application/vnd.google-apps.presentation': 'Google Slides',
  'application/pdf': 'PDF',
  'text/plain': 'Text',
  'text/markdown': 'Markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Doc',
};

const MIME_COLORS: Record<string, string> = {
  'application/vnd.google-apps.document': '#4285F4',
  'application/vnd.google-apps.spreadsheet': '#34A853',
  'application/vnd.google-apps.presentation': '#FBBC04',
  'application/pdf': '#EA4335',
  'text/plain': '#6B7280',
  'text/markdown': '#6B7280',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '#2B5797',
};

function FileIcon({ mimeType, size = 20 }: { mimeType: string; size?: number }) {
  const color = MIME_COLORS[mimeType] || '#6B7280';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    return <FileSpreadsheet size={size} color={color} />;
  }
  if (mimeType === 'application/vnd.google-apps.presentation') {
    return <File size={size} color={color} />;
  }
  return <FileText size={size} color={color} />;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function DrivePage() {
  const { user } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; updated: number; unchanged: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch('/api/drive');
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) setNotConfigured(true);
        else setError(data.error || 'Failed to load Drive files');
        return;
      }
      setFiles(data.data || []);
      setNotConfigured(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load Drive files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchFiles();
  }, [user, router, fetchFiles]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/drive', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ synced: data.synced, updated: data.updated, unchanged: data.unchanged });
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // Mime type categories for filter
  const mimeTypes = Array.from(new Set(files.map(f => f.mimeType)));
  const mimeLabels = mimeTypes.reduce<Record<string, string>>((acc, m) => {
    acc[m] = MIME_LABELS[m] || 'Other';
    return acc;
  }, {});

  const filtered = files.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || f.mimeType === filter;
    return matchSearch && matchFilter;
  });

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {!isMobile && <Sidebar />}

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: isMobile ? 0 : '240px',
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '16px' : '20px 28px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          {/* Google Drive colour icon */}
          <svg width="24" height="24" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
              Google Drive
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
              {loading ? 'Loading…' : `${files.length} files accessible`}
            </p>
          </div>

          <button
            onClick={fetchFiles}
            disabled={loading}
            title="Refresh"
            style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}
          >
            <RefreshCw size={16} color="#6B7280" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          <button
            onClick={handleSync}
            disabled={syncing || loading || notConfigured}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF3300',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: syncing || loading || notConfigured ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: syncing || loading || notConfigured ? 0.6 : 1,
            }}
          >
            {syncing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
            {isMobile ? 'Sync' : 'Sync to Documents'}
          </button>
        </div>

        {/* Sync result banner */}
        {syncResult && (
          <div style={{
            padding: '10px 28px',
            backgroundColor: '#D1FAE5',
            borderBottom: '1px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: '#065F46',
          }}>
            <CheckCircle2 size={16} />
            Sync complete — {syncResult.synced} new, {syncResult.updated} updated, {syncResult.unchanged} unchanged.
            {syncResult.synced + syncResult.updated > 0 && (
              <a href="/documents" style={{ marginLeft: '4px', color: '#065F46', fontWeight: 600, textDecoration: 'underline' }}>
                View in Documents →
              </a>
            )}
          </div>
        )}

        {/* Search + filter bar */}
        {!notConfigured && !error && (
          <div style={{
            padding: '12px 28px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search files..."
                style={{
                  width: '100%', padding: '8px 8px 8px 32px',
                  border: '1px solid #E5E7EB', borderRadius: '8px',
                  fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none',
                  backgroundColor: '#F9FAFB',
                }}
              />
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px',
                fontSize: '0.85rem', backgroundColor: '#F9FAFB', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">All types</option>
              {Object.entries(mimeLabels).map(([mime, label]) => (
                <option key={mime} value={mime}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 28px', paddingBottom: isMobile ? '80px' : '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>Loading Drive files…</p>
            </div>
          ) : notConfigured ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <HardDrive size={40} color="#D1D5DB" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#111827', fontSize: '1.1rem', fontWeight: 600 }}>
                Google Drive not configured
              </h3>
              <p style={{ margin: '0 0 16px', color: '#6B7280', maxWidth: '400px', lineHeight: 1.6 }}>
                To enable Drive access, a service account with domain-wide delegation is required.
                Set <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>GOOGLE_SA_CREDENTIALS</code> in Vercel environment variables.
              </p>
              <a
                href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', backgroundColor: '#111827', color: '#fff',
                  borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                }}
              >
                Google Cloud Console <ArrowUpRight size={14} />
              </a>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <AlertCircle size={36} color="#EF4444" style={{ marginBottom: '12px' }} />
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#111827' }}>Error loading Drive</p>
              <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#6B7280' }}>{error}</p>
              <button
                onClick={fetchFiles}
                style={{ padding: '8px 16px', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Try Again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9CA3AF' }}>
              <FolderOpen size={36} style={{ marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>{search ? 'No files match your search' : 'No files found in Drive'}</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              {/* Table header (desktop) */}
              {!isMobile && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 100px 120px 48px',
                  padding: '10px 16px',
                  borderBottom: '1px solid #F3F4F6',
                  backgroundColor: '#F9FAFB',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <span>Name</span>
                  <span>Type</span>
                  <span>Size</span>
                  <span>Modified</span>
                  <span></span>
                </div>
              )}

              {/* File rows */}
              {filtered.map((file, idx) => (
                <div
                  key={file.id}
                  style={{
                    display: isMobile ? 'flex' : 'grid',
                    gridTemplateColumns: isMobile ? undefined : '1fr 140px 100px 120px 48px',
                    flexDirection: isMobile ? 'row' : undefined,
                    alignItems: 'center',
                    gap: isMobile ? '10px' : undefined,
                    padding: isMobile ? '12px 16px' : '12px 16px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: isMobile ? 1 : undefined }}>
                    <FileIcon mimeType={file.mimeType} size={20} />
                    <span style={{
                      fontSize: '0.875rem', color: '#111827', fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {file.name}
                    </span>
                  </div>

                  {/* Type */}
                  {!isMobile && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      display: 'inline-block',
                      width: 'fit-content',
                    }}>
                      {MIME_LABELS[file.mimeType] || 'File'}
                    </span>
                  )}

                  {/* Size */}
                  {!isMobile && (
                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {formatSize(file.size)}
                    </span>
                  )}

                  {/* Modified */}
                  {!isMobile && (
                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {formatDate(file.modifiedTime)}
                    </span>
                  )}

                  {/* Open link */}
                  {file.webViewLink ? (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Drive"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '6px', borderRadius: '6px', color: '#6B7280',
                        textDecoration: 'none', flexShrink: 0,
                        border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
                      }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span style={{ width: '32px' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info panel about sync */}
          {!loading && !notConfigured && !error && files.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              backgroundColor: '#EFF6FF',
              borderRadius: '10px',
              border: '1px solid #BFDBFE',
              fontSize: '0.8rem',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <HardDrive size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                <strong>Sync to Documents</strong> imports these files into your{' '}
                <a href="/documents" style={{ color: '#1D4ED8', fontWeight: 600 }}>Documents library</a>{' '}
                for searching and previewing inside the dashboard. Files open in Google Drive — no copies are made.
              </span>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
