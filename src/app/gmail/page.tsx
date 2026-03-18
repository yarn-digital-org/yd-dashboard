'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import {
  Mail, Search, RefreshCw, Archive, Star, Reply,
  X, Send, ChevronLeft, AlertCircle, Loader2, Plus,
} from 'lucide-react';

interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  isStarred: boolean;
  labels: string[];
  body?: string;
  bodyType?: 'html' | 'text';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || '?';
}

function sanitizeHtml(html: string): string {
  // Remove script tags and event handlers but keep safe HTML
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

export default function GmailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [replyMode, setReplyMode] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchMessages = useCallback(async (query?: string, token?: string) => {
    try {
      if (!token) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const params = new URLSearchParams({ maxResults: '25' });
      if (query) params.set('q', query);
      if (token) params.set('pageToken', token);

      const res = await fetch(`/api/gmail/messages?${params}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NOT_CONNECTED' || data.code === 'TOKEN_EXPIRED') {
          setNotConnected(true);
          return;
        }
        throw new Error(data.error || 'Failed to load messages');
      }

      if (token) {
        setMessages(prev => [...prev, ...data.messages]);
      } else {
        setMessages(data.messages || []);
      }
      setNextPageToken(data.nextPageToken);
    } catch (err: any) {
      setError(err.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user, fetchMessages]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchMessages(q || undefined), 400);
  };

  const openMessage = async (msg: GmailMessage) => {
    setShowDetail(true);
    if (msg.body !== undefined) {
      setSelectedMessage(msg);
      return;
    }
    setLoadingMessage(true);
    setSelectedMessage(msg);
    try {
      const res = await fetch(`/api/gmail/messages/${msg.id}`);
      const full = await res.json();
      setSelectedMessage(full);
      // Mark as read
      if (msg.isUnread) {
        await fetch(`/api/gmail/messages/${msg.id}/read`, { method: 'POST' });
        setMessages(prev =>
          prev.map(m => m.id === msg.id ? { ...m, isUnread: false } : m)
        );
      }
    } catch {
      // Keep partial message shown
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/gmail/messages/${id}/archive`, { method: 'POST' });
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
      setShowDetail(false);
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setComposeTo(selectedMessage.from);
    setComposeSubject(`Re: ${selectedMessage.subject.replace(/^Re:\s*/i, '')}`);
    setComposeBody(`\n\n--- Original message ---\n${selectedMessage.snippet}`);
    setReplyMode(true);
    setShowCompose(true);
  };

  const handleSend = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;
    setComposeSending(true);
    try {
      await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          message: composeBody,
          ...(replyMode && selectedMessage ? {
            replyToMessageId: selectedMessage.id,
            threadId: selectedMessage.threadId,
          } : {}),
        }),
      });
      setShowCompose(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setReplyMode(false);
    } catch {
      // handle error
    } finally {
      setComposeSending(false);
    }
  };

  const cardStyle = {
    background: 'var(--card-bg, #111)',
    border: '1px solid var(--border, #222)',
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a' }}>
        <Loader2 size={24} style={{ color: '#555', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (notConnected) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
        {!isMobile && <Sidebar />}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <AlertCircle size={48} style={{ color: '#555', margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Gmail Not Connected</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Connect your Google account to access your Gmail inbox. You may need to re-authorize if you previously connected for Calendar only.
            </p>
            <a
              href="/api/auth/google/authorize"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#e63312', color: '#fff', padding: '0.75rem 1.5rem',
                borderRadius: '9999px', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem',
              }}
            >
              <Mail size={16} />
              Connect Google Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  const MessageList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Mail size={18} style={{ color: '#e63312', flexShrink: 0 }} />
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>Inbox</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => fetchMessages(searchQuery || undefined)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#555' }}
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={() => { setReplyMode(false); setComposeTo(''); setComposeSubject(''); setComposeBody(''); setShowCompose(true); }}
          style={{ background: '#e63312', border: 'none', cursor: 'pointer', padding: '0.375rem 0.75rem', borderRadius: '6px', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 500 }}
        >
          <Plus size={12} /> Compose
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input
            type="text"
            placeholder="Search mail..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem', color: '#fff', fontSize: '0.85rem', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 size={20} style={{ color: '#555', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>{error}</div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#555', fontSize: '0.875rem' }}>No messages found</div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid #1a1a1a',
                  cursor: 'pointer',
                  background: selectedMessage?.id === msg.id ? '#1a1a1a' : 'transparent',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (selectedMessage?.id !== msg.id) (e.currentTarget as HTMLDivElement).style.background = '#141414'; }}
                onMouseLeave={e => { if (selectedMessage?.id !== msg.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, color: '#888',
                }}>
                  {getInitials(msg.from)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{
                      fontSize: '0.875rem', color: msg.isUnread ? '#fff' : '#888',
                      fontWeight: msg.isUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {msg.from}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#555', flexShrink: 0, marginLeft: '0.5rem' }}>
                      {formatDate(msg.date)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.8rem', color: msg.isUnread ? '#ddd' : '#666',
                    fontWeight: msg.isUnread ? 500 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '0.15rem',
                  }}>
                    {msg.subject}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.snippet}
                  </div>
                </div>
                {msg.isUnread && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e63312', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            ))}
            {nextPageToken && (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <button
                  onClick={() => fetchMessages(searchQuery || undefined, nextPageToken)}
                  disabled={loadingMore}
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {loadingMore ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const MessageDetail = () => {
    if (!selectedMessage) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>
          <Mail size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '0.9rem' }}>Select a message to read</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Detail header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isMobile && (
            <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '0.25rem', marginRight: '0.25rem' }}>
              <ChevronLeft size={18} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
              {selectedMessage.subject}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleReply} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '0.375rem 0.75rem', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              <Reply size={13} /> Reply
            </button>
            <button onClick={() => handleArchive(selectedMessage.id)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '0.375rem 0.75rem', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              <Archive size={13} /> Archive
            </button>
          </div>
        </div>

        {/* Sender info */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem', fontWeight: 600, color: '#888' }}>
              {getInitials(selectedMessage.from)}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{selectedMessage.from}</div>
              <div style={{ color: '#666', fontSize: '0.8rem' }}>
                {selectedMessage.from} → {selectedMessage.to || 'me'}
              </div>
              <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                {new Date(selectedMessage.date).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loadingMessage ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 size={20} style={{ color: '#555', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : selectedMessage.body ? (
            selectedMessage.bodyType === 'html' ? (
              <div
                style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedMessage.body) }}
              />
            ) : (
              <pre style={{ color: '#ccc', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                {selectedMessage.body}
              </pre>
            )
          ) : (
            <p style={{ color: '#666', fontSize: '0.875rem' }}>{selectedMessage.snippet}</p>
          )}
        </div>
      </div>
    );
  };

  const ComposeModal = () => (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '1rem',
    }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', width: '100%', maxWidth: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{replyMode ? 'Reply' : 'New Message'}</span>
          <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          <input
            placeholder="To"
            value={composeTo}
            onChange={e => setComposeTo(e.target.value)}
            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #2a2a2a', color: '#fff', padding: '0.5rem 0', fontSize: '0.875rem', outline: 'none' }}
          />
          <input
            placeholder="Subject"
            value={composeSubject}
            onChange={e => setComposeSubject(e.target.value)}
            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #2a2a2a', color: '#fff', padding: '0.5rem 0', fontSize: '0.875rem', outline: 'none' }}
          />
          <textarea
            placeholder="Write your message..."
            value={composeBody}
            onChange={e => setComposeBody(e.target.value)}
            rows={8}
            style={{ background: 'transparent', border: 'none', color: '#ccc', fontSize: '0.875rem', outline: 'none', resize: 'none', lineHeight: 1.6, flex: 1 }}
          />
        </div>
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSend}
            disabled={composeSending || !composeTo || !composeSubject || !composeBody}
            style={{
              background: '#e63312', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '0.5rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '0.4rem', fontSize: '0.875rem', fontWeight: 500, opacity: composeSending ? 0.7 : 1,
            }}
          >
            {composeSending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      {!isMobile && <Sidebar />}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100vh' }}>
        {/* Mobile: show list OR detail */}
        {isMobile ? (
          showDetail ? <MessageDetail /> : <MessageList />
        ) : (
          /* Desktop: split view */
          <>
            <div style={{ width: 360, borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <MessageList />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <MessageDetail />
            </div>
          </>
        )}
      </div>

      {showCompose && <ComposeModal />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
    </div>
  );
}
