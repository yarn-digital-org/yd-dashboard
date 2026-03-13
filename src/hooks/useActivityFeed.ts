// useActivityFeed — reusable hook for real-time activity data
// Composable into any dashboard page (e.g. home, task board)

import { useState, useEffect, useRef, useCallback } from 'react';

export interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  eventType: string;
  taskId?: string;
  taskTitle?: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface UseActivityFeedOptions {
  agentId?: string;
  maxEvents?: number;
  autoConnect?: boolean;
}

interface UseActivityFeedReturn {
  events: ActivityEvent[];
  connected: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  logEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => Promise<void>;
}

export function useActivityFeed({
  agentId,
  maxEvents = 50,
  autoConnect = true,
}: UseActivityFeedOptions = {}): UseActivityFeedReturn {
  const [events, setEvents]     = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: String(maxEvents) });
      if (agentId) params.set('agentId', agentId);

      const res  = await fetch(`/api/activity-feed?${params}`);
      const data = await res.json();

      if (data.success) {
        setEvents(data.events);
        setError(null);
      } else {
        setError(data.error ?? 'Failed to load activity');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [agentId, maxEvents]);

  // Initial load
  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  // SSE subscription
  useEffect(() => {
    if (!autoConnect) return;

    const url = agentId
      ? `/api/activity-feed/stream?agentId=${agentId}`
      : '/api/activity-feed/stream';

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen  = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'activity') {
          setEvents(prev => {
            if (prev.some(ev => ev.id === payload.event.id)) return prev;
            return [payload.event, ...prev].slice(0, maxEvents);
          });
        }
      } catch { /* ignore */ }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [agentId, autoConnect, maxEvents]);

  // Log a new event from the current agent
  const logEvent = useCallback(async (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    try {
      await fetch('/api/activity-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (err) {
      console.error('Failed to log activity event:', err);
    }
  }, []);

  return {
    events,
    connected,
    loading,
    error,
    refresh: fetchInitial,
    logEvent,
  };
}
