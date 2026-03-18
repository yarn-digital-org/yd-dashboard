/**
 * Gmail API utilities
 * Uses per-user OAuth tokens stored in Firebase (same flow as Calendar)
 */
import { google, gmail_v1 } from 'googleapis';
import { getUserCalendarTokens, refreshAccessToken } from '@/lib/google-calendar-user';
import { getValidAccessToken } from '@/lib/google-accounts';
import { adminDb } from '@/lib/firebase-admin';

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  hasAttachments: boolean;
  labels: string[];
  body?: string;
}

export interface GmailThread {
  id: string;
  messages: GmailMessage[];
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isRead: boolean;
  messageCount: number;
}

/**
 * Get Gmail client for a user using their OAuth tokens
 */
export async function getGmailClient(userId: string, accountEmail?: string): Promise<gmail_v1.Gmail> {
  // Use multi-account token retrieval (also falls back to legacy single-account)
  const tokenData = await getValidAccessToken(userId, accountEmail);
  if (!tokenData) {
    throw new Error('Google account not connected. Please connect Google in Settings > Integrations.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth not configured');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

  oauth2Client.setCredentials({
    access_token: tokenData.accessToken,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Parse email headers into a friendly object
 */
function parseHeaders(headers: gmail_v1.Schema$MessagePartHeader[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of headers || []) {
    if (h.name && h.value) {
      result[h.name.toLowerCase()] = h.value;
    }
  }
  return result;
}

/**
 * Extract display name and email from a From header
 */
function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
  }
  return { name: from, email: from };
}

/**
 * Extract plain text body from message parts
 */
function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return '';

  // Direct body
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
  }

  // Multipart — prefer text/plain
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64url').toString('utf-8');
      }
    }
    // Fallback: text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = Buffer.from(part.body.data, 'base64url').toString('utf-8');
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    // Recurse into nested parts
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }

  return '';
}

/**
 * Convert a Gmail API message to our GmailMessage format
 */
function formatMessage(msg: gmail_v1.Schema$Message, includeBody = false): GmailMessage {
  const headers = parseHeaders(msg.payload?.headers || []);
  const { name: fromName, email: fromEmail } = parseFrom(headers['from'] || '');
  const labels = msg.labelIds || [];
  const isRead = !labels.includes('UNREAD');
  const hasAttachments = (msg.payload?.parts || []).some(
    p => p.filename && p.filename.length > 0
  );

  return {
    id: msg.id || '',
    threadId: msg.threadId || '',
    from: fromName,
    fromEmail,
    to: headers['to'] || '',
    subject: headers['subject'] || '(no subject)',
    snippet: msg.snippet || '',
    date: headers['date'] || '',
    isRead,
    hasAttachments,
    labels,
    body: includeBody ? extractBody(msg.payload) : undefined,
  };
}

/**
 * List inbox messages
 */
export async function listInboxMessages(
  userId: string,
  options: { maxResults?: number; pageToken?: string; q?: string } = {},
  accountEmail?: string
): Promise<{ messages: GmailMessage[]; nextPageToken?: string; totalEstimate?: number }> {
  const gmail = await getGmailClient(userId, accountEmail);

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    maxResults: options.maxResults || 25,
    pageToken: options.pageToken,
    q: options.q,
  });

  const messageIds = listRes.data.messages || [];
  if (messageIds.length === 0) {
    return { messages: [], nextPageToken: listRes.data.nextPageToken || undefined };
  }

  // Batch fetch message details
  const messages = await Promise.all(
    messageIds.map(async ({ id }) => {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: id!,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
      });
      return formatMessage(msg.data);
    })
  );

  return {
    messages,
    nextPageToken: listRes.data.nextPageToken || undefined,
    totalEstimate: listRes.data.resultSizeEstimate || undefined,
  };
}

/**
 * Get a single message with full body
 */
export async function getMessage(userId: string, messageId: string): Promise<GmailMessage | null> {
  const gmail = await getGmailClient(userId);

  const msg = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  if (!msg.data) return null;

  // Mark as read
  if (msg.data.labelIds?.includes('UNREAD')) {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: { removeLabelIds: ['UNREAD'] },
    });
  }

  return formatMessage(msg.data, true);
}

/**
 * Send an email
 */
export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string
): Promise<void> {
  const gmail = await getGmailClient(userId);

  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }

  const raw = Buffer.from(
    headers.join('\r\n') + '\r\n\r\n' + body
  ).toString('base64url');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}

/**
 * Archive (remove INBOX label) from a message
 */
export async function archiveMessage(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['INBOX'] },
  });
}

export async function markAsRead(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
}
