import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import {
  listUserCalendarEvents,
  createUserCalendarEvent,
  getUserCalendarTokens,
} from '@/lib/google-calendar-user';
import { listGoogleAccounts, getValidAccessToken } from '@/lib/google-accounts';
import { google } from 'googleapis';

// Colour palette assigned per-account (in order of connection)
const ACCOUNT_COLOURS = [
  '#4285F4', // Google Blue
  '#EA4335', // Red
  '#34A853', // Green
  '#FBBC04', // Yellow
  '#9C27B0', // Purple
  '#FF6D00', // Orange
  '#00BCD4', // Cyan
  '#795548', // Brown
];

// Helper to get current user ID from auth cookie
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) return null;
    
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// Fetch events for a single account using its access token
async function fetchEventsForAccount(
  accessToken: string,
  options: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    q?: string;
  }
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId: options.calendarId || 'primary',
    timeMin: options.timeMin,
    timeMax: options.timeMax,
    maxResults: options.maxResults || 100,
    singleEvents: true,
    orderBy: 'startTime',
    q: options.q,
  });

  return response.data.items || [];
}

// GET /api/calendar/events - List events from ALL connected Google accounts
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || undefined;
    const timeMax = searchParams.get('timeMax') || undefined;
    const maxResults = searchParams.get('maxResults')
      ? parseInt(searchParams.get('maxResults')!, 10)
      : 100;
    const q = searchParams.get('q') || undefined;
    const calendarId = searchParams.get('calendarId') || undefined;
    const defaultTimeMin = timeMin || new Date().toISOString();

    // Get all connected Google accounts (new format + legacy fallback)
    const accounts = await listGoogleAccounts(userId);

    // If no accounts at all, fall back to legacy single-account path
    if (accounts.length === 0) {
      const tokens = await getUserCalendarTokens(userId);
      if (!tokens) {
        return NextResponse.json(
          {
            error: 'Google Calendar not connected',
            code: 'NOT_CONNECTED',
            message: 'Please connect your Google Calendar in Settings > Integrations',
          },
          { status: 403 }
        );
      }

      const result = await listUserCalendarEvents(userId, {
        calendarId,
        timeMin: defaultTimeMin,
        timeMax,
        maxResults,
        q,
      });

      // Tag all events with the primary account email + colour
      const taggedEvents = (result.events || []).map((evt: any) => ({
        ...evt,
        accountEmail: tokens.email,
        accountColor: ACCOUNT_COLOURS[0],
      }));

      return NextResponse.json({
        success: true,
        data: {
          events: taggedEvents,
          calendarSummary: result.summary,
          calendarId: calendarId || 'primary',
          accounts: [{ email: tokens.email, displayName: tokens.email, color: ACCOUNT_COLOURS[0] }],
        },
      });
    }

    // Fetch events from all accounts in parallel
    const accountsMeta: Array<{ email: string; displayName?: string; color: string }> = [];
    const allEvents: any[] = [];

    await Promise.all(
      accounts.map(async (account, idx) => {
        const color = ACCOUNT_COLOURS[idx % ACCOUNT_COLOURS.length];
        accountsMeta.push({
          email: account.email,
          displayName: account.displayName || account.email,
          color,
        });

        try {
          const tokenResult = await getValidAccessToken(userId, account.email);
          if (!tokenResult) return; // account token expired / missing

          const events = await fetchEventsForAccount(tokenResult.accessToken, {
            calendarId,
            timeMin: defaultTimeMin,
            timeMax,
            maxResults,
            q,
          });

          for (const evt of events) {
            allEvents.push({
              ...evt,
              accountEmail: account.email,
              accountColor: color,
            });
          }
        } catch (err) {
          // Partial failure: log but don't block other accounts
          console.error(`[calendar/events] Failed to fetch for ${account.email}:`, err);
        }
      })
    );

    // Sort merged events by start time
    allEvents.sort((a, b) => {
      const aStart = a.start?.dateTime || a.start?.date || '';
      const bStart = b.start?.dateTime || b.start?.date || '';
      return aStart < bStart ? -1 : aStart > bStart ? 1 : 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        events: allEvents,
        calendarId: calendarId || 'primary',
        accounts: accountsMeta,
      },
    });
  } catch (error: any) {
    console.error('Error listing Google Calendar events:', error);

    if (((error as Error)?.message || '') === 'Google Calendar not connected') {
      return NextResponse.json(
        {
          error: 'Google Calendar not connected',
          code: 'NOT_CONNECTED',
          message: 'Please connect your Google Calendar in Settings > Integrations',
        },
        { status: 403 }
      );
    }

    if (((error as Error)?.message || '')?.includes('refresh token') || ((error as Error)?.message || '')?.includes('reconnect')) {
      return NextResponse.json(
        {
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          message: 'Please reconnect your Google Calendar in Settings > Integrations',
        },
        { status: 403 }
      );
    }

    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        {
          error: 'Calendar access denied',
          code: 'ACCESS_DENIED',
          details: process.env.NODE_ENV === 'development' ? String((error as Error)?.message || '') : undefined,
        },
        { status: 403 }
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        {
          error: 'Calendar not found',
          code: 'NOT_FOUND',
          details: process.env.NODE_ENV === 'development' ? String((error as Error)?.message || '') : undefined,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendar events', details: process.env.NODE_ENV === 'development' ? String((error as Error)?.message || '') : undefined },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events - Create new event in user's Google Calendar
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const tokens = await getUserCalendarTokens(userId);
    
    if (!tokens) {
      return NextResponse.json(
        {
          error: 'Google Calendar not connected',
          code: 'NOT_CONNECTED',
          message: 'Please connect your Google Calendar in Settings > Integrations',
        },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    const {
      summary,
      description,
      location,
      start,
      end,
      attendees,
      reminders,
      colorId,
      recurrence,
      calendarId,
      date,
      startTime,
      endTime,
      timeZone,
      allDay,
    } = data;

    if (!summary?.trim()) {
      return NextResponse.json(
        { error: 'Summary (title) is required' },
        { status: 400 }
      );
    }

    interface EventInput {
      summary: string;
      description?: string;
      location?: string;
      start: { dateTime?: string; date?: string; timeZone?: string };
      end: { dateTime?: string; date?: string; timeZone?: string };
      attendees?: Array<{ email: string; displayName?: string }>;
      reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> };
      colorId?: string;
      recurrence?: string[];
    }

    let eventInput: EventInput;

    if (start && end) {
      eventInput = { summary: summary.trim(), description, location, start, end, attendees, reminders, colorId, recurrence };
    } else if (date) {
      const tz = timeZone || 'Europe/London';
      if (allDay || (!startTime && !endTime)) {
        eventInput = { summary: summary.trim(), description, location, start: { date }, end: { date }, attendees, reminders, colorId, recurrence };
      } else {
        const startDateTime = startTime?.includes('T') ? startTime : `${date}T${startTime}:00`;
        const endDateTime = endTime?.includes('T') ? endTime : `${date}T${endTime}:00`;
        eventInput = { summary: summary.trim(), description, location, start: { dateTime: startDateTime, timeZone: tz }, end: { dateTime: endDateTime, timeZone: tz }, attendees, reminders, colorId, recurrence };
      }
    } else {
      return NextResponse.json({ error: 'Either start/end objects or date field is required' }, { status: 400 });
    }

    const event = await createUserCalendarEvent(userId, eventInput, calendarId);

    return NextResponse.json({ success: true, event, message: 'Event created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);

    if (((error as Error)?.message || '') === 'Google Calendar not connected') {
      return NextResponse.json(
        { error: 'Google Calendar not connected', code: 'NOT_CONNECTED', message: 'Please connect your Google Calendar in Settings > Integrations' },
        { status: 403 }
      );
    }

    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        { error: 'Calendar access denied', code: 'ACCESS_DENIED', details: process.env.NODE_ENV === 'development' ? String((error as Error)?.message || '') : undefined },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create calendar event', details: process.env.NODE_ENV === 'development' ? String((error as Error)?.message || '') : undefined },
      { status: 500 }
    );
  }
}
