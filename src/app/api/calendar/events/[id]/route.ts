import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import {
  getUserCalendarTokens,
  getValidAccessToken,
  getUserCalendarClient,
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

// GET /api/calendar/events/[id] - Get single event from user's Google Calendar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId') || 'primary';

    const accessToken = await getValidAccessToken(userId);
    const calendar = getUserCalendarClient(accessToken);

    const response = await calendar.events.get({
      calendarId,
      eventId: id,
    });

    return NextResponse.json({
      success: true,
      event: response.data,
      calendarId,
    });
  } catch (error: any) {
    console.error('Error fetching Google Calendar event:', error);

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

    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Event not found', code: 'NOT_FOUND' },
        { status: 404 }
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

    return NextResponse.json(
      { error: 'Failed to fetch calendar event', details: process.env.NODE_ENV === 'development' ? String((error as Error)?.message || '') : undefined },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/events/[id] - Update event in user's Google Calendar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
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
      // Convenience fields
      date,
      startTime,
      endTime,
      timeZone,
      allDay,
    } = data;

    // Build update object - only include provided fields
    const updates: Record<string, any> = {};

    if (summary !== undefined) {
      updates.summary = summary.trim();
    }
    if (description !== undefined) {
      updates.description = description;
    }
    if (location !== undefined) {
      updates.location = location;
    }
    if (attendees !== undefined) {
      updates.attendees = attendees;
    }
    if (reminders !== undefined) {
      updates.reminders = reminders;
    }
    if (colorId !== undefined) {
      updates.colorId = colorId;
    }
    if (recurrence !== undefined) {
      updates.recurrence = recurrence;
    }

    // Handle start/end updates
    if (start && end) {
      updates.start = start;
      updates.end = end;
    } else if (date !== undefined) {
      const tz = timeZone || 'Europe/London';
      
      if (allDay || (!startTime && !endTime)) {
        updates.start = { date };
        updates.end = { date };
      } else if (startTime && endTime) {
        const startDateTime = startTime.includes('T')
          ? startTime
          : `${date}T${startTime}:00`;
        const endDateTime = endTime.includes('T')
          ? endTime
          : `${date}T${endTime}:00`;

        updates.start = { dateTime: startDateTime, timeZone: tz };
        updates.end = { dateTime: endDateTime, timeZone: tz };
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(userId);
    const calendar = getUserCalendarClient(accessToken);
    const calId = calendarId || 'primary';

    const response = await calendar.events.patch({
      calendarId: calId,
      eventId: id,
      requestBody: updates,
      sendUpdates: 'none',
    });

    return NextResponse.json({
      success: true,
      event: response.data,
      message: 'Event updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating Google Calendar event:', error);

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

    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Event not found', code: 'NOT_FOUND' },
        { status: 404 }
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

    return NextResponse.json(
      { error: 'Failed to update calendar event', details: process.env.NODE_ENV === 'development' ? String((error as Error)?.message || '') : undefined },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[id] - Delete event from user's Google Calendar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId') || 'primary';

    const accessToken = await getValidAccessToken(userId);
    const calendar = getUserCalendarClient(accessToken);

    await calendar.events.delete({
      calendarId,
      eventId: id,
      sendUpdates: 'none',
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
      eventId: id,
    });
  } catch (error: any) {
    console.error('Error deleting Google Calendar event:', error);

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

    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Event not found', code: 'NOT_FOUND' },
        { status: 404 }
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

    return NextResponse.json(
      { error: 'Failed to delete calendar event', details: process.env.NODE_ENV === 'development' ? String((error as Error)?.message || '') : undefined },
      { status: 500 }
    );
  }
}
