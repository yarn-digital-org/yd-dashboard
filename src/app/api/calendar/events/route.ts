import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import {
  listUserCalendarEvents,
  createUserCalendarEvent,
  getUserCalendarTokens,
} from '@/lib/google-calendar-user';

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

// GET /api/calendar/events - List events from user's Google Calendar
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check if user has connected Google Calendar
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

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const timeMin = searchParams.get('timeMin') || undefined;
    const timeMax = searchParams.get('timeMax') || undefined;
    const maxResults = searchParams.get('maxResults') 
      ? parseInt(searchParams.get('maxResults')!, 10) 
      : 100;
    const q = searchParams.get('q') || undefined;
    const pageToken = searchParams.get('pageToken') || undefined;
    const calendarId = searchParams.get('calendarId') || undefined;
    
    // Default time range: if not specified, get events from now onwards
    const defaultTimeMin = timeMin || new Date().toISOString();

    const result = await listUserCalendarEvents(userId, {
      calendarId,
      timeMin: defaultTimeMin,
      timeMax,
      maxResults,
      q,
      pageToken,
    });

    return NextResponse.json({
      success: true,
      data: {
        events: result.events,
        nextPageToken: result.nextPageToken,
        calendarSummary: result.summary,
        calendarId: calendarId || 'primary',
      },
    });
  } catch (error: any) {
    console.error('Error listing Google Calendar events:', error);
    
    // Handle specific errors
    if (error.message === 'Google Calendar not connected') {
      return NextResponse.json(
        { 
          error: 'Google Calendar not connected',
          code: 'NOT_CONNECTED',
          message: 'Please connect your Google Calendar in Settings > Integrations',
        },
        { status: 403 }
      );
    }

    if (error.message?.includes('refresh token') || error.message?.includes('reconnect')) {
      return NextResponse.json(
        { 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          message: 'Please reconnect your Google Calendar in Settings > Integrations',
        },
        { status: 403 }
      );
    }
    
    // Handle Google API errors
    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        { 
          error: 'Calendar access denied',
          code: 'ACCESS_DENIED',
          details: error.message,
        },
        { status: 403 }
      );
    }
    
    if (error.code === 404) {
      return NextResponse.json(
        { 
          error: 'Calendar not found',
          code: 'NOT_FOUND',
          details: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendar events', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events - Create new event in user's Google Calendar
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check if user has connected Google Calendar
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
      // Convenience fields for simpler API
      date,         // YYYY-MM-DD for all-day events
      startTime,    // HH:mm or ISO datetime
      endTime,      // HH:mm or ISO datetime
      timeZone,
      allDay,
    } = data;

    // Validation
    if (!summary?.trim()) {
      return NextResponse.json(
        { error: 'Summary (title) is required' },
        { status: 400 }
      );
    }

    // Build the event object
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

    // If using structured start/end objects (full Google Calendar format)
    if (start && end) {
      eventInput = {
        summary: summary.trim(),
        description,
        location,
        start,
        end,
        attendees,
        reminders,
        colorId,
        recurrence,
      };
    }
    // If using simplified format (date + startTime/endTime)
    else if (date) {
      const tz = timeZone || 'Europe/London';
      
      if (allDay || (!startTime && !endTime)) {
        // All-day event
        eventInput = {
          summary: summary.trim(),
          description,
          location,
          start: { date },
          end: { date },  // For single-day, end date is same as start
          attendees,
          reminders,
          colorId,
          recurrence,
        };
      } else {
        // Timed event
        const startDateTime = startTime?.includes('T') 
          ? startTime 
          : `${date}T${startTime}:00`;
        const endDateTime = endTime?.includes('T')
          ? endTime
          : `${date}T${endTime}:00`;

        eventInput = {
          summary: summary.trim(),
          description,
          location,
          start: { dateTime: startDateTime, timeZone: tz },
          end: { dateTime: endDateTime, timeZone: tz },
          attendees,
          reminders,
          colorId,
          recurrence,
        };
      }
    } else {
      return NextResponse.json(
        { error: 'Either start/end objects or date field is required' },
        { status: 400 }
      );
    }

    const event = await createUserCalendarEvent(userId, eventInput, calendarId);

    return NextResponse.json(
      {
        success: true,
        event,
        message: 'Event created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);

    if (error.message === 'Google Calendar not connected') {
      return NextResponse.json(
        { 
          error: 'Google Calendar not connected',
          code: 'NOT_CONNECTED',
          message: 'Please connect your Google Calendar in Settings > Integrations',
        },
        { status: 403 }
      );
    }

    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        { 
          error: 'Calendar access denied',
          code: 'ACCESS_DENIED',
          details: error.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create calendar event', details: error.message },
      { status: 500 }
    );
  }
}
