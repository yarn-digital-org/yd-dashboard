import { useState, useEffect, useCallback } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  calendarId: string;
  color: string;
  accountEmail?: string;
  accountColor?: string;
}

export interface CalendarAccount {
  email: string;
  displayName?: string;
  color: string;
  enabled: boolean;
}

export type CalendarConnectionStatus = 'connected' | 'not_connected' | 'token_expired' | 'error' | 'loading';

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  connectionStatus: CalendarConnectionStatus;
  accounts: CalendarAccount[];
  toggleAccount: (email: string) => void;
  refetch: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

// Color mapping for Google Calendar color IDs (fallback when no accountColor)
const colorMap: Record<string, string> = {
  '1': '#7986CB',  // Lavender
  '2': '#33B679',  // Sage
  '3': '#8E24AA',  // Grape
  '4': '#E67C73',  // Flamingo
  '5': '#F6BF26',  // Banana
  '6': '#F4511E',  // Tangerine
  '7': '#039BE5',  // Peacock
  '8': '#616161',  // Graphite
  '9': '#3F51B5',  // Blueberry
  '10': '#0B8043', // Basil
  '11': '#D50000', // Tomato
  'default': '#4285F4', // Google Blue
};

export function useCalendarEvents(): UseCalendarEventsReturn {
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<CalendarConnectionStatus>('loading');
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 90);
      
      const res = await fetch(`/api/calendar/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&maxResults=250`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.code === 'NOT_CONNECTED') {
          setConnectionStatus('not_connected');
          setError(null);
          setAllEvents([]);
          setAccounts([]);
          return;
        }
        if (data.code === 'TOKEN_EXPIRED') {
          setConnectionStatus('token_expired');
          setError('Your Google Calendar connection has expired. Please reconnect in Settings.');
          setAllEvents([]);
          return;
        }
        if (data.code === 'UNAUTHORIZED') {
          setConnectionStatus('error');
          setError('Please log in to view your calendar');
          setAllEvents([]);
          return;
        }
        throw new Error(data.error || 'Failed to fetch calendar events');
      }
      
      setConnectionStatus('connected');
      
      if (data.success && data.data?.events) {
        // Set accounts from API response (preserving existing enabled state)
        if (data.data.accounts?.length) {
          setAccounts(prev => {
            const prevMap = new Map(prev.map((a) => [a.email, a.enabled]));
            return data.data.accounts.map((a: { email: string; displayName?: string; color: string }) => ({
              email: a.email,
              displayName: a.displayName,
              color: a.color,
              // Preserve enabled state if account was already tracked, else default true
              enabled: prevMap.has(a.email) ? (prevMap.get(a.email) ?? true) : true,
            }));
          });
        }

        const transformedEvents: CalendarEvent[] = data.data.events.map((event: any) => ({
          id: event.id,
          title: event.summary || '(No title)',
          start: new Date(event.start?.dateTime || event.start?.date),
          end: new Date(event.end?.dateTime || event.end?.date),
          description: event.description || '',
          calendarId: event.organizer?.email || 'primary',
          // Use account colour if available, else fall back to Google colour ID
          color: event.accountColor || colorMap[event.colorId] || colorMap['default'],
          accountEmail: event.accountEmail,
          accountColor: event.accountColor,
        }));
        
        setAllEvents(transformedEvents);
      } else {
        setAllEvents([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch calendar events:', err);
      setConnectionStatus('error');
      setError(err.message || 'Failed to load calendar events');
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Toggle a specific account on/off
  const toggleAccount = useCallback((email: string) => {
    setAccounts(prev =>
      prev.map(a => a.email === email ? { ...a, enabled: !a.enabled } : a)
    );
  }, []);

  // Filter events by enabled accounts
  const enabledEmails = new Set(accounts.filter(a => a.enabled).map(a => a.email));
  const events = accounts.length === 0
    ? allEvents
    : allEvents.filter(evt => !evt.accountEmail || enabledEmails.has(evt.accountEmail));

  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    if (connectionStatus === 'not_connected') {
      throw new Error('Google Calendar not connected. Please connect in Settings > Integrations.');
    }
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.start.toISOString(), timeZone: 'Europe/London' },
          end: { dateTime: event.end.toISOString(), timeZone: 'Europe/London' },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'NOT_CONNECTED') {
          setConnectionStatus('not_connected');
          throw new Error('Google Calendar not connected. Please connect in Settings > Integrations.');
        }
        throw new Error(data.error || 'Failed to create event');
      }
      await fetchEvents();
    } catch (err: any) {
      console.error('Failed to add event:', err);
      throw err;
    }
  }, [fetchEvents, connectionStatus]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    if (connectionStatus === 'not_connected') {
      throw new Error('Google Calendar not connected. Please connect in Settings > Integrations.');
    }
    try {
      const body: any = {};
      if (updates.title) body.summary = updates.title;
      if (updates.description) body.description = updates.description;
      if (updates.start) body.start = { dateTime: updates.start.toISOString(), timeZone: 'Europe/London' };
      if (updates.end) body.end = { dateTime: updates.end.toISOString(), timeZone: 'Europe/London' };

      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update event');
      await fetchEvents();
    } catch (err: any) {
      console.error('Failed to update event:', err);
      throw err;
    }
  }, [fetchEvents, connectionStatus]);

  const deleteEvent = useCallback(async (id: string) => {
    if (connectionStatus === 'not_connected') {
      throw new Error('Google Calendar not connected. Please connect in Settings > Integrations.');
    }
    try {
      const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete event');
      await fetchEvents();
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      throw err;
    }
  }, [fetchEvents, connectionStatus]);

  return {
    events,
    allEvents,
    loading,
    error,
    connectionStatus,
    accounts,
    toggleAccount,
    refetch: fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
