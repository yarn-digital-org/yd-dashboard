import { google, calendar_v3 } from 'googleapis';

// Google Calendar client initialization
// Uses service account with optional domain-wide delegation

export interface GoogleCalendarConfig {
  calendarId?: string;  // Calendar ID to use (default: 'primary' or configured)
  impersonateEmail?: string;  // Email to impersonate if domain-wide delegation is enabled
}

let cachedClient: calendar_v3.Calendar | null = null;
let cachedConfig: GoogleCalendarConfig = {};

function getServiceAccountCredentials() {
  // Try different environment variable formats
  if (process.env.GOOGLE_SA_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_SA_CREDENTIALS);
  }
  if (process.env.GOOGLE_SA_CREDENTIALS_BASE64) {
    const decoded = Buffer.from(process.env.GOOGLE_SA_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }
  return null;
}

export function getGoogleCalendarClient(config: GoogleCalendarConfig = {}): calendar_v3.Calendar {
  const configKey = JSON.stringify(config);
  
  // Return cached client if config matches
  if (cachedClient && JSON.stringify(cachedConfig) === configKey) {
    return cachedClient;
  }

  const credentials = getServiceAccountCredentials();
  
  if (!credentials) {
    throw new Error('Google Service Account credentials not configured. Set GOOGLE_SA_CREDENTIALS or GOOGLE_SA_CREDENTIALS_BASE64 environment variable.');
  }

  const authOptions: any = {
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  };

  // If impersonation email is provided (domain-wide delegation)
  const impersonateEmail = config.impersonateEmail || process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL;
  if (impersonateEmail) {
    authOptions.clientOptions = {
      subject: impersonateEmail,
    };
  }

  const auth = new google.auth.GoogleAuth(authOptions);
  
  cachedClient = google.calendar({ version: 'v3', auth });
  cachedConfig = config;
  
  return cachedClient;
}

export function getDefaultCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

// Helper types for calendar events
export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;  // ISO 8601 format for timed events
    date?: string;      // YYYY-MM-DD for all-day events
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  colorId?: string;
  recurrence?: string[];
}

export interface ListEventsOptions {
  calendarId?: string;
  timeMin?: string;  // ISO 8601
  timeMax?: string;  // ISO 8601
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  q?: string;  // Free text search
  pageToken?: string;
}

// Calendar API wrapper functions
export async function listCalendarEvents(options: ListEventsOptions = {}) {
  const calendar = getGoogleCalendarClient();
  const calendarId = options.calendarId || getDefaultCalendarId();

  const response = await calendar.events.list({
    calendarId,
    timeMin: options.timeMin,
    timeMax: options.timeMax,
    maxResults: options.maxResults || 100,
    singleEvents: options.singleEvents ?? true,
    orderBy: options.orderBy || 'startTime',
    q: options.q,
    pageToken: options.pageToken,
  });

  return {
    events: response.data.items || [],
    nextPageToken: response.data.nextPageToken,
    summary: response.data.summary,
  };
}

export async function getCalendarEvent(eventId: string, calendarId?: string) {
  const calendar = getGoogleCalendarClient();
  const calId = calendarId || getDefaultCalendarId();

  const response = await calendar.events.get({
    calendarId: calId,
    eventId,
  });

  return response.data;
}

export async function createCalendarEvent(event: CalendarEventInput, calendarId?: string) {
  const calendar = getGoogleCalendarClient();
  const calId = calendarId || getDefaultCalendarId();

  const response = await calendar.events.insert({
    calendarId: calId,
    requestBody: event,
    sendUpdates: 'none',  // Don't send email notifications
  });

  return response.data;
}

export async function updateCalendarEvent(
  eventId: string,
  event: Partial<CalendarEventInput>,
  calendarId?: string
) {
  const calendar = getGoogleCalendarClient();
  const calId = calendarId || getDefaultCalendarId();

  const response = await calendar.events.patch({
    calendarId: calId,
    eventId,
    requestBody: event,
    sendUpdates: 'none',
  });

  return response.data;
}

export async function deleteCalendarEvent(eventId: string, calendarId?: string) {
  const calendar = getGoogleCalendarClient();
  const calId = calendarId || getDefaultCalendarId();

  await calendar.events.delete({
    calendarId: calId,
    eventId,
    sendUpdates: 'none',
  });

  return { success: true, eventId };
}

// Utility to list available calendars (useful for setup)
export async function listCalendars() {
  const calendar = getGoogleCalendarClient();
  
  const response = await calendar.calendarList.list();
  
  return response.data.items || [];
}

// Utility to check calendar access
export async function checkCalendarAccess(calendarId?: string): Promise<{ 
  accessible: boolean; 
  calendarId: string;
  summary?: string;
  error?: string;
}> {
  const calId = calendarId || getDefaultCalendarId();
  
  try {
    const calendar = getGoogleCalendarClient();
    const response = await calendar.calendars.get({
      calendarId: calId,
    });
    
    return {
      accessible: true,
      calendarId: calId,
      summary: response.data.summary || undefined,
    };
  } catch (error: any) {
    return {
      accessible: false,
      calendarId: calId,
      error: error.message,
    };
  }
}
