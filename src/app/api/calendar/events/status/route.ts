import { NextRequest, NextResponse } from 'next/server';
import {
  checkCalendarAccess,
  listCalendars,
  getDefaultCalendarId,
} from '@/lib/google-calendar';

// GET /api/calendar/events/status - Check Google Calendar connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId') || getDefaultCalendarId();
    const listAll = searchParams.get('listCalendars') === 'true';

    // Check access to the specified calendar
    const accessCheck = await checkCalendarAccess(calendarId);

    // Optionally list all accessible calendars
    let calendars: any[] = [];
    if (listAll) {
      try {
        calendars = await listCalendars();
      } catch (e: any) {
        calendars = [{ error: e.message }];
      }
    }

    return NextResponse.json({
      status: accessCheck.accessible ? 'connected' : 'error',
      calendarId: accessCheck.calendarId,
      calendarSummary: accessCheck.summary,
      error: accessCheck.error,
      ...(listAll && { availableCalendars: calendars }),
      config: {
        defaultCalendarId: getDefaultCalendarId(),
        impersonateEmail: process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL || null,
        credentialsConfigured: !!(
          process.env.GOOGLE_SA_CREDENTIALS ||
          process.env.GOOGLE_SA_CREDENTIALS_BASE64
        ),
      },
    });
  } catch (error: any) {
    console.error('Error checking Google Calendar status:', error);

    return NextResponse.json({
      status: 'error',
      error: ((error as Error)?.message || ''),
      config: {
        defaultCalendarId: getDefaultCalendarId(),
        credentialsConfigured: !!(
          process.env.GOOGLE_SA_CREDENTIALS ||
          process.env.GOOGLE_SA_CREDENTIALS_BASE64
        ),
      },
    });
  }
}
