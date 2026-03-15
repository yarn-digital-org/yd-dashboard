import { withAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { importGoogleEvents, syncAllEventsToGoogle } from '@/lib/google-calendar-sync';

// POST - Sync events between app and Google Calendar
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const { action, timeMin, timeMax, calendarId } = body;

    if (!action) {
      return errorResponse('Action is required', 400, 'VALIDATION_ERROR');
    }

    if (action === 'import') {
      // Import Google events to app (incremental if syncToken exists, full otherwise)
      const result = await importGoogleEvents(user.userId, timeMin, timeMax, calendarId);

      if (!result.success) {
        return errorResponse(result.error || 'Failed to import events', 500, 'IMPORT_ERROR');
      }

      const syncType = result.wasIncremental ? 'incremental' : 'full';
      return successResponse({
        message: `${syncType === 'incremental' ? 'Incrementally synced' : 'Imported'} ${result.imported} new, ${result.updated} updated, ${result.deleted} deleted events from Google Calendar`,
        imported: result.imported,
        updated: result.updated,
        deleted: result.deleted,
        wasIncremental: result.wasIncremental,
      });
    } else if (action === 'export') {
      // Export app events to Google
      const result = await syncAllEventsToGoogle(user.userId);

      if (!result.success) {
        return errorResponse('Failed to sync events to Google Calendar', 500, 'SYNC_ERROR');
      }

      return successResponse({
        message: `Synced ${result.synced} events to Google Calendar`,
        synced: result.synced,
        errors: result.errors,
      });
    } else {
      return errorResponse('Invalid action. Use "import" or "export"', 400, 'VALIDATION_ERROR');
    }
  } catch (error: any) {
    console.error('Error syncing calendar:', error);
    return errorResponse('Failed to sync calendar', 500, 'SYNC_ERROR');
  }
});
