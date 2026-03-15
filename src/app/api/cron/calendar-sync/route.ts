import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { importGoogleEvents } from '@/lib/google-calendar-sync';

/**
 * Cron job: sync Google Calendar for all connected users every 15 minutes.
 * Uses syncToken-based incremental sync — only fetches changed events.
 *
 * Vercel cron config (vercel.json):
 *   { "path": "/api/cron/calendar-sync", "schedule": "* /15 * * * *" }
 *   (every 15 minutes)
 *
 * Security: requests must include Authorization: Bearer <CRON_SECRET>
 * or come from Vercel's internal cron runner (which sets the header automatically).
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Find all users who have connected Google Calendar
    const integrationsSnapshot = await adminDb
      .collectionGroup('integrations')
      .where('__name__', '>=', 'users/')
      .get()
      .catch(() => null);

    // Firestore collectionGroup query on subcollection named 'integrations',
    // filtered to only 'google' docs
    const googleDocs = await adminDb
      .collectionGroup('integrations')
      .get();

    const connectedUserIds: string[] = [];
    for (const doc of googleDocs.docs) {
      // Path: users/{userId}/integrations/google
      const pathParts = doc.ref.path.split('/');
      if (pathParts.length === 4 && pathParts[0] === 'users' && pathParts[2] === 'integrations' && pathParts[3] === 'google') {
        const data = doc.data();
        // Only include users with valid refresh tokens (can auto-refresh)
        if (data?.accessToken && data?.refreshToken) {
          connectedUserIds.push(pathParts[1]);
        }
      }
    }

    if (connectedUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No connected users to sync',
        synced: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Sync each user — incremental where possible
    const results: Array<{
      userId: string;
      success: boolean;
      imported: number;
      updated: number;
      deleted: number;
      wasIncremental: boolean;
      error?: string;
    }> = [];

    for (const userId of connectedUserIds) {
      try {
        const result = await importGoogleEvents(userId);
        results.push({
          userId,
          success: result.success,
          imported: result.imported,
          updated: result.updated,
          deleted: result.deleted,
          wasIncremental: result.wasIncremental,
          error: result.error,
        });
      } catch (err: any) {
        console.error(`[calendar-cron] Error syncing user ${userId}:`, err);
        results.push({
          userId,
          success: false,
          imported: 0,
          updated: 0,
          deleted: 0,
          wasIncremental: false,
          error: err.message,
        });
      }
    }

    const totalImported = results.reduce((s, r) => s + r.imported, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const totalDeleted = results.reduce((s, r) => s + r.deleted, 0);
    const failures = results.filter((r) => !r.success).length;
    const incrementalCount = results.filter((r) => r.wasIncremental).length;

    console.log(
      `[calendar-cron] Synced ${connectedUserIds.length} users: ` +
        `${totalImported} imported, ${totalUpdated} updated, ${totalDeleted} deleted. ` +
        `${incrementalCount}/${connectedUserIds.length} incremental. ${failures} failures.`
    );

    return NextResponse.json({
      success: failures === 0,
      usersProcessed: connectedUserIds.length,
      incrementalSyncs: incrementalCount,
      totalImported,
      totalUpdated,
      totalDeleted,
      failures,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[calendar-cron] Fatal error:', error);
    return NextResponse.json(
      { error: 'Calendar sync cron failed', details: error.message },
      { status: 500 }
    );
  }
}
