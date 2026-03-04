import { useState, useEffect, useCallback } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  calendarId: string;
  color: string;
}

export type CalendarConnectionStatus = 'connected' | 'not_connected' | 'token_expired' | 'error' | 'loading';

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  connectionStatus: CalendarConnectionStatus;
  refetch: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

// Color mapping for Google Calendar color IDs
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
  'default': '#FF3300', // Yarn orange
};

export function useCalendarEvents(): UseCalendarEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<CalendarConnectionStatus>('loading');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate time range: 30 days in past to 90 days in future
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 90);
      
      const res = await fetch(`/api/calendar/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&maxResults=250`);
      const data = await res.json();
      
      if (!res.ok) {
        // Handle specific error codes
        if (data.code === 'NOT_CONNECTED') {
          setConnectionStatus('not_connected');
          setError(null);
          setEvents([]);
          return;
        }
        
        if (data.code === 'TOKEN_EXPIRED') {
          setConnectionStatus('token_expired');
          setError('Your Google Calendar connection has expired. Please reconnect in Settings.');
          setEvents([]);
          return;
        }
        
        if (data.code === 'UNAUTHORIZED') {
          setConnectionStatus('error');
          setError('Please log in to view your calendar');
          setEvents([]);
          return;
        }
        
        throw new Error(data.error || 'Failed to fetch calendar events');
      }
      
      setConnectionStatus('connected');
      
      if (data.success && data.data?.events) {
        // Transform API response to CalendarEvent format
        const transformedEvents: CalendarEvent[] = data.data.events.map((event: any) => ({
          id: event.id,
          title: event.summary || '(No title)',
          start: new Date(event.start?.dateTime || event.start?.date),
          end: new Date(event.end?.dateTime || event.end?.date),
          description: event.description || '',
          calendarId: event.organizer?.email || 'primary',
          color: colorMap[event.colorId] || colorMap['default'],
        }));
        
        setEvents(transformedEvents);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch calendar events:', err);
      setConnectionStatus('error');
      setError(err.message || 'Failed to load calendar events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
          start: {
            dateTime: event.start.toISOString(),
            timeZone: 'Europe/London',
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: 'Europe/London',
          },
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
      
      // Refresh events list
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
      if (updates.start) {
        body.start = {
          dateTime: updates.start.toISOString(),
          timeZone: 'Europe/London',
        };
      }
      if (updates.end) {
        body.end = {
          dateTime: updates.end.toISOString(),
          timeZone: 'Europe/London',
        };
      }
      
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update event');
      }
      
      // Refresh events list
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
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }
      
      // Refresh events list
      await fetchEvents();
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      throw err;
    }
  }, [fetchEvents, connectionStatus]);

  return {
    events,
    loading,
    error,
    connectionStatus,
    refetch: fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
