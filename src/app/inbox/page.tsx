'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Mail,
  RefreshCw,
  Search,
  ArrowLeft,
  Paperclip,
  Circle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  X,
} from 'lucide-react';

interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  hasAttachments: boolean;
  labels: string[];
  body?: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return d.toLocaleDateString('en-GB', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  } catch {
    return dateStr;
  }
}

function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || '?';
}

function avatarColor(name: string): string {
  const colors = ['#FF3300', '#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9c27b0', '#ff6d00'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function InboxPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const fetchMessages = useCallback(async (q?: string, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ maxResults: '30' });
      if (q) params.set('q', q);

      const res = await fetch(`/api/gmail?${params}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.notConnected) {
          setNotConnected(true);
        } else {
          setError(data.error || 'Failed to load inbox');
        }
        return;
      }

      setMessages(data.messages || []);
      setNextPageToken(data.nextPageToken);
      setNotConnected(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchMessages();
  }, [user, router, fetchMessages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    fetchMessages(searchInput || undefined);
  };

  const openMessage = async (msg: EmailMessage) => {
    setSelectedMessage({ ...msg, isRead: true });
    setShowReply(false);
    setReplyText('');
    setLoadingMessage(true);

    try {
      const res = await fetch(`/api/gmail/${msg.id}`);
      const data = await res.json();
      if (res.ok && data.message) {
        setSelectedMessage(data.message);
        // Update read state in list
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      }
    } catch {
      // Keep showing snippet if full load fails
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedMessage.fromEmail,
          subject: `Re: ${selectedMessage.subject}`,
          body: replyText,
          inReplyTo: selectedMessage.id,
        }),
      });
      if (res.ok) {
        setReplyText('');
        setShowReply(false);
      }
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  // Styles
  const s = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' } as React.CSSProperties,
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      marginLeft: isMobile ? 0 : '240px',
      height: '100vh',
      overflow: 'hidden',
    },
    header: {
      padding: isMobile ? '16px' : '20px 28px',
      borderBottom: '1px solid #E5E7EB',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexShrink: 0,
    },
    body: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    list: {
      width: selectedMessage && !isMobile ? '380px' : '100%',
      display: selectedMessage && isMobile ? 'none' : 'flex',
      flexDirection: 'column' as const,
      borderRight: '1px solid #E5E7EB',
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    },
    detail: {
      flex: 1,
      display: selectedMessage || !isMobile ? 'flex' : 'none',
      flexDirection: 'column' as const,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    },
  };

  if (!user) return null;

  return (
    <div style={s.page}>
      {!isMobile && <Sidebar />}
      <main style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <Mail size={22} color="#FF3300" />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
              Inbox
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '8px', backgroundColor: '#FF3300', color: '#fff',
                  borderRadius: '999px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                }}>
                  {unreadCount}
                </span>
              )}
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>Google Workspace emails</p>
          </div>
          <button
            onClick={() => fetchMessages(searchQuery || undefined, true)}
            disabled={refreshing}
            style={{
              padding: '8px', border: '1px solid #E5E7EB', borderRadius: '8px',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
            title="Refresh"
          >
            <RefreshCw size={16} color="#6B7280" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {/* Message list */}
          <div style={s.list}>
            {/* Search */}
            <form onSubmit={handleSearch} style={{ padding: '12px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search emails..."
                  style={{
                    width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #E5E7EB',
                    borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box',
                    outline: 'none', backgroundColor: '#F9FAFB',
                  }}
                />
              </div>
            </form>

            {/* List content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                  <p style={{ margin: 0 }}>Loading inbox...</p>
                </div>
              ) : notConnected ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <AlertCircle size={32} color="#FF3300" style={{ marginBottom: '12px' }} />
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#111827' }}>Google account not connected</p>
                  <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#6B7280' }}>
                    Connect your Google account to access Gmail.
                  </p>
                  <a
                    href="/settings/integrations"
                    style={{
                      display: 'inline-block', padding: '8px 16px',
                      backgroundColor: '#FF3300', color: '#fff', borderRadius: '8px',
                      textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                    }}
                  >
                    Connect Google Account
                  </a>
                  <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                    Note: You may need to re-authorise to grant Gmail access.
                  </p>
                </div>
              ) : error ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <AlertCircle size={32} color="#EF4444" style={{ marginBottom: '12px' }} />
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#111827' }}>Error loading inbox</p>
                  <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#6B7280' }}>{error}</p>
                  <button
                    onClick={() => fetchMessages()}
                    style={{
                      padding: '8px 16px', backgroundColor: '#111827', color: '#fff',
                      borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                  <Mail size={32} style={{ marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>No messages found</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      backgroundColor: selectedMessage?.id === msg.id ? '#FFF5F3' : msg.isRead ? '#fff' : '#FAFBFF',
                      borderLeft: selectedMessage?.id === msg.id ? '3px solid #FF3300' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: avatarColor(msg.from),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        {getInitials(msg.from)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{
                            fontSize: '0.875rem', fontWeight: msg.isRead ? 500 : 700,
                            color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {msg.from}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {!msg.isRead && <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#FF3300' }} />}
                            {msg.hasAttachments && <Paperclip size={11} color="#9CA3AF" />}
                            <span style={{ fontSize: '0.7rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                              {formatDate(msg.date)}
                            </span>
                          </div>
                        </div>
                        <p style={{
                          margin: '0 0 2px', fontSize: '0.8rem', fontWeight: msg.isRead ? 400 : 600,
                          color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {msg.subject}
                        </p>
                        <p style={{
                          margin: 0, fontSize: '0.75rem', color: '#9CA3AF',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {msg.snippet}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message detail */}
          <div style={s.detail}>
            {!selectedMessage ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB' }}>
                <div style={{ textAlign: 'center' }}>
                  <Mail size={48} style={{ marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>Select an email to read</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Detail header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
                  {isMobile && (
                    <button
                      onClick={() => setSelectedMessage(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                  )}
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                    {selectedMessage.subject}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: avatarColor(selectedMessage.from),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {getInitials(selectedMessage.from)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                        {selectedMessage.from}
                        <span style={{ fontWeight: 400, color: '#6B7280' }}> &lt;{selectedMessage.fromEmail}&gt;</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF' }}>
                        To: {selectedMessage.to} · {selectedMessage.date ? new Date(selectedMessage.date).toLocaleString('en-GB') : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  {loadingMessage ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', paddingTop: '40px' }}>
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : selectedMessage.body?.includes('<') ? (
                    <div
                      style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#374151' }}
                      dangerouslySetInnerHTML={{ __html: selectedMessage.body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '') }}
                    />
                  ) : (
                    <pre style={{
                      margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: '#374151',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit',
                    }}>
                      {selectedMessage.body || selectedMessage.snippet}
                    </pre>
                  )}
                </div>

                {/* Reply */}
                {showReply ? (
                  <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${selectedMessage.from}...`}
                      rows={4}
                      style={{
                        width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px',
                        padding: '10px 12px', fontSize: '0.875rem', resize: 'vertical',
                        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setShowReply(false)}
                        style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendReply}
                        disabled={sending || !replyText.trim()}
                        style={{
                          padding: '8px 16px', backgroundColor: '#FF3300', color: '#fff',
                          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem',
                          display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500,
                          opacity: sending || !replyText.trim() ? 0.6 : 1,
                        }}
                      >
                        <Send size={14} /> {sending ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 24px', borderTop: '1px solid #E5E7EB', flexShrink: 0, display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowReply(true)}
                      style={{
                        padding: '8px 16px', backgroundColor: '#FF3300', color: '#fff',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem',
                        display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500,
                      }}
                    >
                      <Send size={14} /> Reply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
