/**
 * Google Drive sync utilities
 * Uses service account credentials (same as Calendar)
 * Env vars: GOOGLE_SA_CREDENTIALS or GOOGLE_SA_CREDENTIALS_BASE64
 * Optional: GOOGLE_DRIVE_FOLDER_ID — root folder to index (defaults to all accessible files)
 */
import { google, drive_v3 } from 'googleapis';
import { adminDb } from '@/lib/firebase-admin';

function parseCredentialsJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    // Handle case where private_key has literal newlines instead of \n
    const fixed = raw.replace(/\\n/g, '\n');
    try {
      return JSON.parse(fixed);
    } catch {
      // Last resort: fix unescaped newlines inside the JSON string value
      const fixed2 = raw.replace(/("private_key"\s*:\s*")([\s\S]*?)(")/g, (_m, pre, key, post) => {
        return pre + key.replace(/\n/g, '\\n') + post;
      });
      return JSON.parse(fixed2);
    }
  }
}

function getServiceAccountCredentials() {
  if (process.env.GOOGLE_SA_CREDENTIALS) {
    return parseCredentialsJson(process.env.GOOGLE_SA_CREDENTIALS);
  }
  if (process.env.GOOGLE_SA_CREDENTIALS_BASE64) {
    return JSON.parse(Buffer.from(process.env.GOOGLE_SA_CREDENTIALS_BASE64, 'base64').toString('utf-8'));
  }
  // Also try the user OAuth credentials path
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return parseCredentialsJson(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  return null;
}

export function getDriveClient(impersonateEmail?: string): drive_v3.Drive {
  const credentials = getServiceAccountCredentials();
  if (!credentials) {
    throw new Error('Google service account credentials not configured. Set GOOGLE_SA_CREDENTIALS env var.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = new (google.auth.JWT as any)(
    credentials.client_email,
    undefined,
    credentials.private_key,
    ['https://www.googleapis.com/auth/drive.readonly'],
    impersonateEmail
  );
  return google.drive({ version: 'v3', auth });
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  description?: string;
}

export interface SyncedDocument {
  driveFileId: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  driveCreatedAt?: string;
  driveModifiedAt?: string;
  category: string;
  syncedAt: string;
  userId: string;
  source: 'google_drive';
  // For text/doc files, we store a content preview
  contentPreview?: string;
}

const INDEXABLE_TYPES = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MIME_TO_CATEGORY: Record<string, string> = {
  'application/vnd.google-apps.document': 'Google Doc',
  'application/vnd.google-apps.spreadsheet': 'Google Sheet',
  'application/vnd.google-apps.presentation': 'Google Slides',
  'application/pdf': 'PDF',
  'text/plain': 'Text',
  'text/markdown': 'Markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Doc',
};

/**
 * List files from a Google Drive folder (or entire drive if no folderId given)
 */
export async function listDriveFiles(
  folderId?: string,
  pageToken?: string,
  impersonateEmail?: string
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const drive = getDriveClient(impersonateEmail);

  let query = `trashed = false`;
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  // Only index useful file types
  const mimeFilters = Array.from(INDEXABLE_TYPES).map(t => `mimeType = '${t}'`).join(' or ');
  query += ` and (${mimeFilters})`;

  const response = await drive.files.list({
    q: query,
    fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, createdTime, modifiedTime, parents, description)',
    pageSize: 100,
    pageToken,
    orderBy: 'modifiedTime desc',
  });

  return {
    files: (response.data.files || []) as DriveFile[],
    nextPageToken: response.data.nextPageToken as string | undefined,
  };
}

/**
 * Export a Google Doc/Sheet/Slide as plain text for content preview
 */
export async function exportFileAsText(
  fileId: string,
  mimeType: string,
  impersonateEmail?: string
): Promise<string> {
  const drive = getDriveClient(impersonateEmail);

  let exportMime = 'text/plain';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    exportMime = 'text/csv';
  } else if (mimeType === 'application/vnd.google-apps.presentation') {
    exportMime = 'text/plain';
  }

  if (mimeType.startsWith('application/vnd.google-apps.')) {
    const res = await drive.files.export({ fileId, mimeType: exportMime }, { responseType: 'text' });
    return (res.data as string).slice(0, 2000); // Preview only
  }

  // For plain text / markdown, download directly
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    return (res.data as string).slice(0, 2000);
  }

  return '';
}

/**
 * Sync Drive files into Firestore documents collection for a user.
 * Returns counts of new/updated/unchanged files.
 */
export async function syncDriveToFirestore(
  userId: string,
  folderId?: string,
  impersonateEmail?: string
): Promise<{ synced: number; updated: number; unchanged: number; errors: number }> {
  if (!adminDb) throw new Error('Database not configured');

  let synced = 0, updated = 0, unchanged = 0, errors = 0;
  let pageToken: string | undefined;

  do {
    const { files, nextPageToken } = await listDriveFiles(folderId, pageToken, impersonateEmail);
    pageToken = nextPageToken;

    for (const file of files) {
      try {
        // Check if already indexed
        const existing = await adminDb
          .collection('documents')
          .where('driveFileId', '==', file.id)
          .where('userId', '==', userId)
          .limit(1)
          .get();

        const modifiedTime = file.modifiedTime || '';

        if (!existing.empty) {
          const existingData = existing.docs[0].data();
          // Skip if not modified
          if (existingData.driveModifiedAt === modifiedTime) {
            unchanged++;
            continue;
          }
          // Update
          await existing.docs[0].ref.update({
            name: file.name,
            driveModifiedAt: modifiedTime,
            syncedAt: new Date().toISOString(),
            webViewLink: file.webViewLink,
          });
          updated++;
        } else {
          // Get content preview for text files
          let contentPreview = '';
          try {
            if (INDEXABLE_TYPES.has(file.mimeType) && file.mimeType !== 'application/pdf') {
              contentPreview = await exportFileAsText(file.id, file.mimeType, impersonateEmail);
            }
          } catch {
            // Non-fatal — skip preview
          }

          const doc: SyncedDocument = {
            driveFileId: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            webViewLink: file.webViewLink,
            driveCreatedAt: file.createdTime,
            driveModifiedAt: modifiedTime,
            category: MIME_TO_CATEGORY[file.mimeType] || 'Other',
            syncedAt: new Date().toISOString(),
            userId,
            source: 'google_drive',
            contentPreview: contentPreview || undefined,
          };

          await adminDb.collection('documents').add(doc);
          synced++;
        }
      } catch (err) {
        console.error(`[drive-sync] Error processing ${file.id}:`, err);
        errors++;
      }
    }
  } while (pageToken);

  return { synced, updated, unchanged, errors };
}
