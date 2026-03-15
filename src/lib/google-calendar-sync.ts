/**
 * Google Calendar sync utilities
 * Syncs events between app calendar and Google Calendar
 *
 * Supports syncToken-based incremental sync:
 * - First run: full import, stores nextSyncToken in Firestore
 * - Subsequent runs: only fetch events changed since last sync token
 * - Handles: new events, updated events, deleted (cancelled) events
 * - Auto-refreshes expired access tokens via getValidAccessToken()
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  listUserCalendarEvents,
  createUserCalendarEvent,
  updateUserCalendarEvent,
  deleteUserCalendarEvent,
  getValidAccessToken,
} from '@/lib/google-calendar-user';

export interface AppCalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  allDay?: boolean;
  attendees?: Array<{ email: string; name?: string }>;
  userId: string;
  googleEventId?: string; // Link to Google Calendar event
  source?: 'google' | 'app';
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncResult {
  success: boolean;
  imported: number;
  updated: number;
  deleted: number;
  errors: number;
  error?: string;
  wasIncremental: boolean; // true if syncToken was used
}

// ─── Token storage ────────────────────────────────────────────────────────────

/**
 * Get stored syncToken for a user's calendar
 */
async function getSyncToken(userId: string, calendarId = 'primary'): Promise<string | null> {
  if (!adminDb) return null;
  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('calendar_sync')
    .doc(calendarId)
    .get();
  return doc.exists ? (doc.data()?.syncToken ?? null) : null;
}

/**
 * Store syncToken after a successful sync
 */
async function saveSyncToken(userId: string, syncToken: string, calendarId = 'primary'): Promise<void> {
  if (!adminDb) return;
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('calendar_sync')
    .doc(calendarId)
    .set({
      syncToken,
      lastSyncAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Clear stored syncToken (forces full re-sync on next run)
 */
async function clearSyncToken(userId: string, calendarId = 'primary'): Promise<void> {
  if (!adminDb) return;
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('calendar_sync')
    .doc(calendarId)
    .delete();
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

function googleEventToApp(googleEvent: any, userId: string): Partial<AppCalendarEvent> {
  return {
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description || undefined,
    location: googleEvent.location || undefined,
    startDate: googleEvent.start?.dateTime || googleEvent.start?.date || new Date().toISOString(),
    endDate: googleEvent.end?.dateTime || googleEvent.end?.date || new Date().toISOString(),
    allDay: !googleEvent.start?.dateTime,
    attendees:
      googleEvent.attendees?.map((a: any) => ({
        email: a.email || '',
        name: a.displayName || undefined,
      })) || undefined,
    userId,
    googleEventId: googleEvent.id,
    source: 'google',
    updatedAt: new Date().toISOString(),
  };
}

async function upsertGoogleEvent(googleEvent: any, userId: string): Promise<'created' | 'updated' | 'skipped'> {
  if (!adminDb || !googleEvent.id) return 'skipped';

  const existing = await adminDb
    .collection('calendar_events')
    .where('userId', '==', userId)
    .where('googleEventId', '==', googleEvent.id)
    .limit(1)
    .get();

  const eventData = googleEventToApp(googleEvent, userId);

  if (existing.empty) {
    await adminDb.collection('calendar_events').add({
      ...eventData,
      createdAt: new Date().toISOString(),
    });
    return 'created';
  } else {
    await existing.docs[0].ref.update(eventData);
    return 'updated';
  }
}

async function removeGoogleEvent(googleEventId: string, userId: string): Promise<boolean> {
  if (!adminDb) return false;
  const snapshot = await adminDb
    .collection('calendar_events')
    .where('userId', '==', userId)
    .where('googleEventId', '==', googleEventId)
    .limit(1)
    .get();
  if (snapshot.empty) return false;
  await snapshot.docs[0].ref.delete();
  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Incremental (or full) import of Google Calendar events into Firestore.
 *
 * - If a syncToken is stored from a previous run, only changed events are fetched.
 * - Cancelled events are deleted from Firestore.
 * - After success, the new syncToken is persisted for the next run.
 * - If Google returns 410 Gone (syncToken invalid), falls back to full sync.
 */
export async function importGoogleEvents(
  userId: string,
  timeMin?: string,
  timeMax?: string,
  calendarId = 'primary'
): Promise<SyncResult> {
  if (!adminDb) {
    return { success: false, imported: 0, updated: 0, deleted: 0, errors: 0, wasIncremental: false, error: 'Database not configured' };
  }

  // Validate token still works first (auto-refreshes if expired)
  try {
    await getValidAccessToken(userId);
  } catch (err: any) {
    return { success: false, imported: 0, updated: 0, deleted: 0, errors: 0, wasIncremental: false, error: err.message };
  }

  const existingSyncToken = await getSyncToken(userId, calendarId);
  const wasIncremental = !!existingSyncToken;

  try {
    return await runImport({ userId, calendarId, syncToken: existingSyncToken || undefined, timeMin, timeMax, wasIncremental });
  } catch (err: any) {
    // 410 Gone = syncToken expired or invalid → fall back to full sync
    if (err?.response?.status === 410 || err?.code === 410 || (err?.message && err.message.includes('410'))) {
      console.warn(`[calendar-sync] syncToken invalid for ${userId}, falling back to full sync`);
      await clearSyncToken(userId, calendarId);
      return await runImport({ userId, calendarId, syncToken: undefined, timeMin, timeMax, wasIncremental: false });
    }
    console.error('[calendar-sync] Import error:', err);
    return { success: false, imported: 0, updated: 0, deleted: 0, errors: 1, wasIncremental, error: err.message };
  }
}

async function runImport(opts: {
  userId: string;
  calendarId: string;
  syncToken?: string;
  timeMin?: string;
  timeMax?: string;
  wasIncremental: boolean;
}): Promise<SyncResult> {
  const { userId, calendarId, syncToken, timeMin, timeMax, wasIncremental } = opts;
  let imported = 0;
  let updated = 0;
  let deleted = 0;
  let errors = 0;
  let pageToken: string | undefined;
  let lastSyncToken: string | undefined;

  // Paginate through all changed events
  do {
    const result = await listUserCalendarEvents(userId, {
      calendarId,
      syncToken,
      pageToken,
      timeMin: syncToken ? undefined : (timeMin || new Date().toISOString()),
      timeMax: syncToken ? undefined : timeMax,
      maxResults: 250,
    });

    for (const event of result.events) {
      try {
        if (event.status === 'cancelled') {
          // Delete removed events
          if (event.id) {
            const removed = await removeGoogleEvent(event.id, userId);
            if (removed) deleted++;
          }
        } else {
          const action = await upsertGoogleEvent(event, userId);
          if (action === 'created') imported++;
          else if (action === 'updated') updated++;
        }
      } catch (err) {
        console.error('[calendar-sync] Error processing event:', event.id, err);
        errors++;
      }
    }

    pageToken = result.nextPageToken as string | undefined;
    if (result.nextSyncToken) {
      lastSyncToken = result.nextSyncToken as string;
    }
  } while (pageToken);

  // Persist the new syncToken for next incremental run
  if (lastSyncToken) {
    await saveSyncToken(userId, lastSyncToken, calendarId);
  }

  return { success: errors === 0, imported, updated, deleted, errors, wasIncremental };
}

// ─── Export (app → Google) ────────────────────────────────────────────────────

/**
 * Sync app event to Google Calendar (create or update)
 */
export async function syncEventToGoogle(
  userId: string,
  appEvent: AppCalendarEvent
): Promise<{ success: boolean; googleEventId?: string; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const eventData = {
      summary: appEvent.title,
      description: appEvent.description,
      location: appEvent.location,
      start: appEvent.allDay
        ? { date: appEvent.startDate.split('T')[0] }
        : { dateTime: appEvent.startDate, timeZone: 'UTC' },
      end: appEvent.allDay
        ? { date: appEvent.endDate.split('T')[0] }
        : { dateTime: appEvent.endDate, timeZone: 'UTC' },
      attendees: appEvent.attendees?.map((a) => ({
        email: a.email,
        displayName: a.name,
      })),
    };

    if (appEvent.googleEventId) {
      await updateUserCalendarEvent(userId, appEvent.googleEventId, eventData);
      return { success: true, googleEventId: appEvent.googleEventId };
    } else {
      const googleEvent = await createUserCalendarEvent(userId, eventData);
      const googleEventId = googleEvent.id;

      if (!googleEventId) {
        return { success: false, error: 'No event ID returned from Google' };
      }

      await adminDb.collection('calendar_events').doc(appEvent.id).update({
        googleEventId,
        source: 'app',
        updatedAt: new Date().toISOString(),
      });

      return { success: true, googleEventId };
    }
  } catch (error: any) {
    console.error('Error syncing event to Google:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete Google Calendar event when app event is deleted
 */
export async function deleteGoogleEvent(
  userId: string,
  googleEventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteUserCalendarEvent(userId, googleEventId);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting Google event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync all unsynced app events to Google Calendar
 */
export async function syncAllEventsToGoogle(
  userId: string
): Promise<{ success: boolean; synced: number; errors: number }> {
  if (!adminDb) {
    return { success: false, synced: 0, errors: 0 };
  }

  try {
    const snapshot = await adminDb
      .collection('calendar_events')
      .where('userId', '==', userId)
      .where('googleEventId', '==', null)
      .get();

    let synced = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
      const appEvent = { id: doc.id, ...doc.data() } as AppCalendarEvent;
      const result = await syncEventToGoogle(userId, appEvent);

      if (result.success) synced++;
      else errors++;
    }

    return { success: errors === 0, synced, errors };
  } catch (error: any) {
    console.error('Error syncing all events:', error);
    return { success: false, synced: 0, errors: 1 };
  }
}
