import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-middleware';
import { listDriveFiles, syncDriveToFirestore } from '@/lib/google-drive';

/**
 * GET  /api/drive          — list files available in Drive (preview before syncing)
 * POST /api/drive          — trigger sync: import Drive files into documents collection
 */

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;
    const impersonateEmail = process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL || undefined;

    const { files } = await listDriveFiles(folderId, undefined, impersonateEmail);

    return NextResponse.json({
      data: files.map(f => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        webViewLink: f.webViewLink,
        modifiedTime: f.modifiedTime,
        size: f.size,
      })),
      total: files.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to list Drive files' },
      { status: err.message?.includes('credentials') ? 503 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const body = await request.json().catch(() => ({}));
    const folderId = body.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;
    const impersonateEmail = process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL || undefined;

    const result = await syncDriveToFirestore(user.userId, folderId, impersonateEmail);

    return NextResponse.json({
      success: result.errors === 0,
      ...result,
      message: `Synced ${result.synced} new, ${result.updated} updated, ${result.unchanged} unchanged from Google Drive`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Drive sync failed' },
      { status: err.message?.includes('credentials') ? 503 : 500 }
    );
  }
}
