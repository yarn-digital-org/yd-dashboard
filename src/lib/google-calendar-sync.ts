/**
 * Google Calendar sync utilities
 * Syncs events between app calendar and Google Calendar
 */

import { adminDb } from '@/lib/firebase-admin';
import {
  listUserCalendarEvents,
  createUserCalendarEvent,
  updateUserCalendarEvent,
  deleteUserCalendarEvent,
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
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sync app event to Google Calendar
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
      // Update existing Google event
      await updateUserCalendarEvent(userId, appEvent.googleEventId, eventData);
      return { success: true, googleEventId: appEvent.googleEventId };
    } else {
      // Create new Google event
      const googleEvent = await createUserCalendarEvent(userId, eventData);
      const googleEventId = googleEvent.id;

      if (!googleEventId) {
        return { success: false, error: 'No event ID returned from Google' };
      }

      // Update app event with Google event ID
      await adminDb.collection('calendar_events').doc(appEvent.id).update({
        googleEventId,
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
 * Import Google Calendar events to app calendar
 */
export async function importGoogleEvents(
  userId: string,
  timeMin?: string,
  timeMax?: string
): Promise<{ success: boolean; imported: number; error?: string }> {
  if (!adminDb) {
    return { success: false, imported: 0, error: 'Database not configured' };
  }

  try {
    const { events } = await listUserCalendarEvents(userId, {
      timeMin: timeMin || new Date().toISOString(),
      timeMax,
      maxResults: 100,
    });

    let imported = 0;

    for (const googleEvent of events) {
      if (!googleEvent.id) continue;

      // Check if event already exists
      const existingSnapshot = await adminDb
        .collection('calendar_events')
        .where('userId', '==', userId)
        .where('googleEventId', '==', googleEvent.id)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        // Event already imported, skip
        continue;
      }

      // Import event
      const appEvent: Partial<AppCalendarEvent> = {
        title: googleEvent.summary || 'Untitled Event',
        description: googleEvent.description || undefined,
        location: googleEvent.location || undefined,
        startDate:
          googleEvent.start?.dateTime || googleEvent.start?.date || new Date().toISOString(),
        endDate: googleEvent.end?.dateTime || googleEvent.end?.date || new Date().toISOString(),
        allDay: !googleEvent.start?.dateTime,
        attendees: googleEvent.attendees?.map((a) => ({
          email: a.email || '',
          name: a.displayName || undefined,
        })) || undefined,
        userId,
        googleEventId: googleEvent.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await adminDb.collection('calendar_events').add(appEvent);
      imported++;
    }

    return { success: true, imported };
  } catch (error: any) {
    console.error('Error importing Google events:', error);
    return { success: false, imported: 0, error: error.message };
  }
}

/**
 * Sync all app events to Google Calendar
 */
export async function syncAllEventsToGoogle(
  userId: string
): Promise<{ success: boolean; synced: number; errors: number }> {
  if (!adminDb) {
    return { success: false, synced: 0, errors: 0 };
  }

  try {
    // Get all app events without Google event IDs
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

      if (result.success) {
        synced++;
      } else {
        errors++;
      }
    }

    return { success: errors === 0, synced, errors };
  } catch (error: any) {
    console.error('Error syncing all events:', error);
    return { success: false, synced: 0, errors: 1 };
  }
}
