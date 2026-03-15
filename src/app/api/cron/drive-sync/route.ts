import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { syncDriveToFirestore } from '@/lib/google-drive';

/**
 * Cron: daily Google Drive auto-sync at 7am UTC
 * Syncs all users who have driveSync enabled in their settings.
 * Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Service account mode: single shared Drive access
    // GOOGLE_DRIVE_FOLDER_ID scopes to a shared team folder
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const impersonateEmail = process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL;

    if (!folderId && !impersonateEmail) {
      return NextResponse.json({
        success: false,
        message: 'GOOGLE_DRIVE_FOLDER_ID or GOOGLE_DRIVE_IMPERSONATE_EMAIL not configured',
      });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    // Find users with drive sync enabled
    const usersSnap = await adminDb.collection('users')
      .where('driveSyncEnabled', '==', true)
      .get();

    if (usersSnap.empty) {
      // Fallback: sync for admin user if ADMIN_USER_ID set
      const adminUserId = process.env.ADMIN_USER_ID;
      if (!adminUserId) {
        return NextResponse.json({ success: true, message: 'No users with drive sync enabled', synced: 0 });
      }

      const result = await syncDriveToFirestore(adminUserId, folderId, impersonateEmail);
      return NextResponse.json({ success: true, results: [{ userId: adminUserId, ...result }] });
    }

    const results = [];
    for (const userDoc of usersSnap.docs) {
      try {
        const result = await syncDriveToFirestore(userDoc.id, folderId, impersonateEmail);
        results.push({ userId: userDoc.id, ...result });
      } catch (err: any) {
        results.push({ userId: userDoc.id, error: err.message });
      }
    }

    const totalSynced = results.reduce((s, r: any) => s + (r.synced || 0), 0);
    console.log(`[drive-cron] Synced ${totalSynced} new files for ${results.length} users`);

    return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[drive-cron] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
