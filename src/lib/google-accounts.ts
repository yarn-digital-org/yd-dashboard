/**
 * Multi-account Google integration utilities
 * Supports multiple Google accounts per user
 * Data stored in users/{userId}/integrations/google_accounts/{email}
 * Backwards compatible: also reads legacy users/{userId}/integrations/google
 */
import { adminDb } from '@/lib/firebase-admin';

export interface GoogleAccountTokens {
  email: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  connectedAt?: string;
  scopes?: string[];
  displayName?: string;
  picture?: string;
}

/**
 * List all connected Google accounts for a user
 */
export async function listGoogleAccounts(userId: string): Promise<GoogleAccountTokens[]> {
  if (!adminDb) throw new Error('Database not configured');

  const accounts: GoogleAccountTokens[] = [];

  // New sub-collection format
  const snap = await adminDb
    .collection('users')
    .doc(userId)
    .collection('google_accounts')
    .get();

  for (const doc of snap.docs) {
    const d = doc.data();
    accounts.push({
      email: doc.id,
      accessToken: d.accessToken,
      refreshToken: d.refreshToken || null,
      expiresAt: d.expiresAt,
      connectedAt: d.connectedAt,
      scopes: d.scopes,
      displayName: d.displayName,
      picture: d.picture,
    });
  }

  // Backwards compat: also include legacy single-account token if not already listed
  const legacyDoc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('integrations')
    .doc('google')
    .get();

  if (legacyDoc.exists) {
    const d = legacyDoc.data();
    const email = d?.email;
    if (email && !accounts.find(a => a.email === email)) {
      accounts.unshift({
        email,
        accessToken: d?.accessToken,
        refreshToken: d?.refreshToken || null,
        expiresAt: d?.expiresAt,
        connectedAt: d?.connectedAt?.toDate?.()?.toISOString(),
        scopes: d?.scopes,
      });
    }
  }

  return accounts;
}

/**
 * Get tokens for a specific Google account (by email)
 * Falls back to legacy single-account if email not specified
 */
export async function getGoogleAccountTokens(
  userId: string,
  email?: string
): Promise<GoogleAccountTokens | null> {
  if (!adminDb) throw new Error('Database not configured');

  if (email) {
    // New format: look up by email
    const doc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('google_accounts')
      .doc(email)
      .get();

    if (doc.exists) {
      const d = doc.data()!;
      return {
        email,
        accessToken: d.accessToken,
        refreshToken: d.refreshToken || null,
        expiresAt: d.expiresAt,
        connectedAt: d.connectedAt,
        scopes: d.scopes,
        displayName: d.displayName,
        picture: d.picture,
      };
    }
  }

  // Fallback to legacy single-account
  const legacyDoc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('integrations')
    .doc('google')
    .get();

  if (!legacyDoc.exists) return null;
  const d = legacyDoc.data()!;
  if (email && d.email !== email) return null; // wrong account

  return {
    email: d.email || '',
    accessToken: d.accessToken,
    refreshToken: d.refreshToken || null,
    expiresAt: d.expiresAt,
    connectedAt: d.connectedAt?.toDate?.()?.toISOString(),
    scopes: d.scopes,
  };
}

/**
 * Save/update Google account tokens (new multi-account format)
 */
export async function saveGoogleAccount(
  userId: string,
  tokens: Omit<GoogleAccountTokens, 'connectedAt'>
): Promise<void> {
  if (!adminDb) throw new Error('Database not configured');

  const now = new Date().toISOString();

  // Save to new sub-collection
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('google_accounts')
    .doc(tokens.email)
    .set({
      ...tokens,
      updatedAt: now,
    }, { merge: true });

  // Also update legacy location for backwards compat (calendar, contacts etc)
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('integrations')
    .doc('google')
    .set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || null,
      expiresAt: tokens.expiresAt,
      email: tokens.email,
      connectedAt: now,
      scopes: tokens.scopes || [],
    }, { merge: true });
}

/**
 * Refresh an expired access token and update storage
 */
export async function refreshGoogleToken(
  userId: string,
  email: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) throw new Error('Google OAuth not configured');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || 'Token refresh failed');
  }

  const accessToken = data.access_token;
  const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;

  if (adminDb) {
    // Update new format
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('google_accounts')
      .doc(email)
      .update({ accessToken, expiresAt });

    // Update legacy
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('google')
      .update({ accessToken, expiresAt });
  }

  return { accessToken, expiresAt };
}

/**
 * Get a valid (refreshed if needed) access token for a specific account
 */
export async function getValidAccessToken(
  userId: string,
  email?: string
): Promise<{ accessToken: string; email: string } | null> {
  const account = await getGoogleAccountTokens(userId, email);
  if (!account) return null;

  // If token not expired (with 5 min buffer), return as-is
  if (account.accessToken && account.expiresAt > Date.now() + 5 * 60 * 1000) {
    return { accessToken: account.accessToken, email: account.email };
  }

  // Refresh if we have a refresh token
  if (account.refreshToken) {
    try {
      const { accessToken } = await refreshGoogleToken(userId, account.email, account.refreshToken);
      return { accessToken, email: account.email };
    } catch (e) {
      console.error('Token refresh failed:', e);
      return null;
    }
  }

  // Token expired, no refresh token
  return null;
}

/**
 * Remove a Google account
 */
export async function removeGoogleAccount(userId: string, email: string): Promise<void> {
  if (!adminDb) throw new Error('Database not configured');
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('google_accounts')
    .doc(email)
    .delete();
}
