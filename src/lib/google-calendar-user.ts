import { google, calendar_v3 } from 'googleapis';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Per-user Google Calendar client
 * Uses OAuth tokens stored in Firebase for each user
 */

export interface UserCalendarTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  email: string;
}

export interface RefreshedTokens {
  accessToken: string;
  expiresAt: number;
}

/**
 * Get user's Google Calendar tokens from Firebase
 */
export async function getUserCalendarTokens(userId: string): Promise<UserCalendarTokens | null> {
  if (!adminDb) {
    throw new Error('Database not configured');
  }

  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('integrations')
    .doc('google')
    .get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    accessToken: data?.accessToken,
    refreshToken: data?.refreshToken || null,
    expiresAt: data?.expiresAt,
    email: data?.email,
  };
}

/**
 * Refresh expired access token using refresh token
 */
export async function refreshAccessToken(
  userId: string,
  refreshToken: string
): Promise<RefreshedTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Token refresh failed:', data);
    throw new Error(data.error_description || 'Failed to refresh access token');
  }

  const { access_token, expires_in } = data;
  const expiresAt = Date.now() + (expires_in * 1000);

  // Update tokens in Firebase
  if (adminDb) {
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('google')
      .update({
        accessToken: access_token,
        expiresAt,
      });
  }

  return {
    accessToken: access_token,
    expiresAt,
  };
}

/**
 * Get a valid access token for user, refreshing if needed
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getUserCalendarTokens(userId);

  if (!tokens) {
    throw new Error('Google Calendar not connected');
  }

  // Check if token is expired (with 5 minute buffer)
  const isExpired = tokens.expiresAt < Date.now() + 5 * 60 * 1000;

  if (isExpired) {
    if (!tokens.refreshToken) {
      throw new Error('Access token expired and no refresh token available. Please reconnect Google Calendar.');
    }

    const refreshed = await refreshAccessToken(userId, tokens.refreshToken);
    return refreshed.accessToken;
  }

  return tokens.accessToken;
}

/**
 * Create Google Calendar client for a specific user
 */
export function getUserCalendarClient(accessToken: string): calendar_v3.Calendar {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * List events from user's calendar
 * Supports syncToken for incremental sync (only changed events since last sync)
 */
export async function listUserCalendarEvents(
  userId: string,
  options: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    q?: string;
    pageToken?: string;
    syncToken?: string; // If provided, only returns events changed since this token
  } = {}
) {
  const accessToken = await getValidAccessToken(userId);
  const calendar = getUserCalendarClient(accessToken);
  const calendarId = options.calendarId || 'primary';

  // When using syncToken, we cannot specify timeMin/timeMax/q
  const params = options.syncToken
    ? {
        calendarId,
        maxResults: options.maxResults || 250,
        singleEvents: true,
        syncToken: options.syncToken,
        pageToken: options.pageToken,
      }
    : {
        calendarId,
        timeMin: options.timeMin,
        timeMax: options.timeMax,
        maxResults: options.maxResults || 100,
        singleEvents: true,
        orderBy: 'startTime' as const,
        q: options.q,
        pageToken: options.pageToken,
      };

  const response = await calendar.events.list(params);

  return {
    events: response.data.items || [],
    nextPageToken: response.data.nextPageToken,
    nextSyncToken: response.data.nextSyncToken,
    summary: response.data.summary,
  };
}

/**
 * Create event in user's calendar
 */
export async function createUserCalendarEvent(
  userId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: Array<{ email: string; displayName?: string }>;
    reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> };
    colorId?: string;
    recurrence?: string[];
  },
  calendarId?: string
) {
  const accessToken = await getValidAccessToken(userId);
  const calendar = getUserCalendarClient(accessToken);
  const calId = calendarId || 'primary';

  const response = await calendar.events.insert({
    calendarId: calId,
    requestBody: event,
    sendUpdates: 'none',
  });

  return response.data;
}

/**
 * Update event in user's calendar
 */
export async function updateUserCalendarEvent(
  userId: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    start?: { dateTime?: string; date?: string; timeZone?: string };
    end?: { dateTime?: string; date?: string; timeZone?: string };
    colorId?: string;
  },
  calendarId?: string
) {
  const accessToken = await getValidAccessToken(userId);
  const calendar = getUserCalendarClient(accessToken);
  const calId = calendarId || 'primary';

  const response = await calendar.events.patch({
    calendarId: calId,
    eventId,
    requestBody: updates,
    sendUpdates: 'none',
  });

  return response.data;
}

/**
 * Delete event from user's calendar
 */
export async function deleteUserCalendarEvent(
  userId: string,
  eventId: string,
  calendarId?: string
) {
  const accessToken = await getValidAccessToken(userId);
  const calendar = getUserCalendarClient(accessToken);
  const calId = calendarId || 'primary';

  await calendar.events.delete({
    calendarId: calId,
    eventId,
    sendUpdates: 'none',
  });

  return { success: true, eventId };
}

/**
 * List user's calendars
 */
export async function listUserCalendars(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  const calendar = getUserCalendarClient(accessToken);

  const response = await calendar.calendarList.list();

  return response.data.items || [];
}
