/**
 * Xero API helper — token refresh + API calls
 */

import { adminDb } from '@/lib/firebase-admin';

const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';

interface XeroTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tenantId: string;
  tenantName?: string;
}

/**
 * Get valid Xero tokens for a user — auto-refreshes if expired
 */
export async function getXeroTokens(userId: string): Promise<XeroTokens | null> {
  if (!adminDb) return null;

  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('integrations')
    .doc('xero')
    .get();

  if (!doc.exists) return null;

  const data = doc.data() as XeroTokens;
  if (!data?.accessToken || !data?.refreshToken) return null;

  // If token is still valid (with 60s buffer), return as-is
  if (data.expiresAt > Date.now() + 60000) {
    return data;
  }

  // Token expired — refresh it
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: data.refreshToken,
      }),
    });

    const tokenData = await res.json();
    if (!res.ok) {
      console.error('Xero token refresh failed:', tokenData);
      return null;
    }

    const updated: XeroTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      tenantId: data.tenantId,
      tenantName: data.tenantName,
    };

    // Store refreshed tokens
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('xero')
      .update({
        accessToken: updated.accessToken,
        refreshToken: updated.refreshToken,
        expiresAt: updated.expiresAt,
      });

    return updated;
  } catch (err) {
    console.error('Xero token refresh error:', err);
    return null;
  }
}

/**
 * Make an authenticated Xero API request
 */
export async function xeroApiRequest(
  userId: string,
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const tokens = await getXeroTokens(userId);
  if (!tokens) {
    return { ok: false, error: 'Xero not connected or token refresh failed' };
  }

  try {
    const res = await fetch(`${XERO_API_BASE}${path}`, {
      method: options.method || 'GET',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'xero-tenant-id': tokens.tenantId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.Message || `Xero API error: ${res.status}` };
    }

    return { ok: true, data };
  } catch (err) {
    console.error('Xero API error:', err);
    return { ok: false, error: 'Failed to call Xero API' };
  }
}

/**
 * Find or create a Xero contact by email
 */
export async function findOrCreateXeroContact(
  userId: string,
  name: string,
  email: string
): Promise<{ ok: boolean; contactId?: string; error?: string }> {
  // Try to find by email first
  const searchResult = await xeroApiRequest(userId, `/Contacts?where=EmailAddress=="${encodeURIComponent(email)}"`);
  
  if (searchResult.ok) {
    const contacts = (searchResult.data as { Contacts?: Array<{ ContactID: string }> })?.Contacts;
    if (contacts && contacts.length > 0) {
      return { ok: true, contactId: contacts[0].ContactID };
    }
  }

  // Create new contact
  const createResult = await xeroApiRequest(userId, '/Contacts', {
    method: 'POST',
    body: {
      Contacts: [{
        Name: name,
        EmailAddress: email,
      }],
    },
  });

  if (createResult.ok) {
    const contacts = (createResult.data as { Contacts?: Array<{ ContactID: string }> })?.Contacts;
    if (contacts && contacts.length > 0) {
      return { ok: true, contactId: contacts[0].ContactID };
    }
  }

  return { ok: false, error: createResult.error || 'Failed to create Xero contact' };
}
