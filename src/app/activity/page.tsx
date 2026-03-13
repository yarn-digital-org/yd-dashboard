'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  eventType: 'task_started' | 'task_completed' | 'task_blocked' | 'task_updated' | 'comment' | 'status_change';
  taskId?: string;
  taskTitle?: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  agentName: string;
  taskTitle?: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_COLOURS: Record<string, { bg: string; text: string; dot: string }> = {
  Radar:  { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  Scout:  { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  Aria:   { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  Bolt:   { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  Jarvis: { bg: 'bg-gray-100',   text: 'text-gray-800',   dot: 'bg-gray-500'   },
  Blaze:  { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
};

const SEVERITY_STYLES: Record<string, string> = {
  info:    'border-l-blue-400 bg-white',
  success: 'border-l-green-400 bg-green-50',
  warning: 'border-l-yellow-400 bg-yellow-50',
  error:   'border-l-red-400 bg-red-50',
};

const SEVERITY_ICONS: Record<string, string> = {
  info:    '●',
  success: '✓',
  warning: '⚠',
  error:   '✕',
};

const EVENT_LABELS: Record<string, string> = {
  task_started:   'started task',
  task_completed: 'completed task',
  task_blocked:   'BLOCKED on',
  task_updated:   'updated task',
  status_change:  'changed status on',
  comment:        'commented on',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function agentStyle(name: string) {
  return AGENT_COLOURS[name] ?? { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-400' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityFeedPage() {
  const [events, setEvents]               = useState<ActivityEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [connected, setConnected]         = useState(false);
  const [filterAgent, setFilterAgent]     = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const feedRef        = useRef<HTMLDivElement>(null);

  // ── Initial data load ────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (filterAgent !== 'all') params.set('agentId', filterAgent);
      if (filterSeverity !== 'all') params.set('severity', filterSeverity);

      const res  = await fetch(`/api/activity-feed?${params}`);
      const data = await res.json();

      if (data.success) {
        setEvents(data.events);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [filterAgent, filterSeverity]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications?limit=20');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchNotifications();
  }, [fetchEvents, fetchNotifications]);

  // ── SSE real-time stream ─────────────────────────────────────────────────

  useEffect(() => {
    const url = filterAgent !== 'all'
      ? `/api/activity-feed/stream?agentId=${filterAgent}`
      : '/api/activity-feed/stream';

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);

        if (payload.type === 'activity') {
          const newEvent: ActivityEvent = payload.event;

          setEvents(prev => {
            // Avoid duplicates
            if (prev.some(ev => ev.id === newEvent.id)) return prev;
            return [newEvent, ...prev].slice(0, 100);
          });

          setLastUpdated(new Date());

          // Scroll feed to top when new event arrives
          feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      setConnected(false);
      // Reconnect in 5s
      setTimeout(() => {
        es.close();
        // Effect will re-run if dependencies change, otherwise it self-heals
      }, 5_000);
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [filterAgent]);

  // ── Notification polling (every 30s) ─────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ── Filtered view ─────────────────────────────────────────────────────────

  const filteredEvents = events.filter(ev => {
    if (filterAgent !== 'all' && ev.agentId !== filterAgent) return false;
    if (filterSeverity !== 'all' && ev.severity !== filterSeverity) return false;
    return true;
  });

  const agents = ['all', 'Radar', 'Scout', 'Aria', 'Bolt', 'Jarvis', 'Blaze'];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Activity Feed</h1>
              <p className="text-sm text-gray-500">
                {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : 'Loading…'}
              </p>
            </div>
            {/* Connection indicator */}
            <span className={`ml-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
              {connected ? 'Live' : 'Reconnecting…'}
            </span>
          </div>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 px-4 py-6 text-center">No notifications</p>
                  ) : notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          n.priority === 'critical' ? 'bg-red-500'
                          : n.priority === 'high'   ? 'bg-orange-500'
                          : 'bg-blue-400'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-xs text-gray-400 mt-1">{n.agentName} · {timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">

        {/* Filters sidebar */}
        <aside className="w-48 flex-shrink-0 space-y-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agent</p>
            <div className="space-y-1">
              {agents.map(a => {
                const style = a !== 'all' ? agentStyle(a) : null;
                return (
                  <button
                    key={a}
                    onClick={() => setFilterAgent(a)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      filterAgent === a ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {style && (
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    )}
                    {a === 'all' ? 'All agents' : a}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Severity</p>
            <div className="space-y-1">
              {['all', 'info', 'success', 'warning', 'error'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterSeverity === s ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-400">
            <p>{filteredEvents.length} events</p>
            <button
              onClick={() => { fetchEvents(); fetchNotifications(); }}
              className="mt-2 text-blue-500 hover:underline"
            >
              Refresh
            </button>
          </div>
        </aside>

        {/* Activity feed */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">No activity yet</p>
              <p className="text-sm mt-1">Events will appear here in real time</p>
            </div>
          ) : (
            <div ref={feedRef} className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
              {filteredEvents.map(ev => {
                const style = agentStyle(ev.agentName);
                return (
                  <div
                    key={ev.id}
                    className={`border-l-4 rounded-lg p-4 shadow-sm ${SEVERITY_STYLES[ev.severity] ?? 'bg-white border-l-gray-300'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Severity icon */}
                        <span className={`mt-0.5 text-xs font-bold flex-shrink-0 ${
                          ev.severity === 'error'   ? 'text-red-600'
                          : ev.severity === 'warning' ? 'text-yellow-600'
                          : ev.severity === 'success' ? 'text-green-600'
                          : 'text-blue-500'
                        }`}>
                          {SEVERITY_ICONS[ev.severity]}
                        </span>

                        <div className="min-w-0">
                          {/* Agent badge + event label */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                              {ev.agentName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {EVENT_LABELS[ev.eventType] ?? ev.eventType}
                            </span>
                            {ev.taskTitle && (
                              <span className="text-xs font-medium text-gray-700 truncate max-w-xs">
                                "{ev.taskTitle}"
                              </span>
                            )}
                          </div>

                          {/* Message */}
                          <p className="text-sm text-gray-800 mt-1">{ev.message}</p>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                        {timeAgo(ev.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
