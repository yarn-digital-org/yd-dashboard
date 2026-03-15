import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// Helper to get a valid access token (reuse Google integration tokens)
async function getGoogleAccessToken(userId: string): Promise<string | null> {
  if (!adminDb) return null;
  
  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('integrations')
    .doc('google')
    .get();
  
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data?.accessToken) return null;
  
  // Check if token is expired
  const isExpired = data.expiresAt < Date.now() + 5 * 60 * 1000;
  
  if (isExpired && data.refreshToken) {
    // Refresh token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: data.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    const tokenData = await response.json();
    if (!response.ok) return null;
    
    const newExpiresAt = Date.now() + (tokenData.expires_in * 1000);
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('google')
      .update({ accessToken: tokenData.access_token, expiresAt: newExpiresAt });
    
    return tokenData.access_token;
  }
  
  return data.accessToken;
}

interface GoogleContact {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
}

// GET — fetch contacts from Google People API for preview
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    const accessToken = await getGoogleAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google not connected. Please connect in Settings > Integrations first.', code: 'NOT_CONNECTED' },
        { status: 403 }
      );
    }
    
    // Fetch contacts from People API
    const contacts: GoogleContact[] = [];
    let nextPageToken: string | undefined;
    
    do {
      const url = new URL('https://people.googleapis.com/v1/people/me/connections');
      url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,organizations');
      url.searchParams.set('pageSize', '100');
      if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        
        // If 403, the contacts scope might not be granted
        if (res.status === 403) {
          return NextResponse.json(
            { 
              error: 'Google Contacts access not granted. Please reconnect Google with contacts permission.',
              code: 'SCOPE_MISSING',
              needsReconnect: true,
            },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          { error: err.error?.message || 'Failed to fetch Google Contacts' },
          { status: 500 }
        );
      }
      
      const data = await res.json();
      
      for (const person of data.connections || []) {
        const names = person.names?.[0] || {};
        const emails = person.emailAddresses || [];
        const phones = person.phoneNumbers || [];
        const orgs = person.organizations || [];
        
        // Skip contacts without email
        const email = emails[0]?.value;
        if (!email) continue;
        
        contacts.push({
          name: names.displayName || '',
          firstName: names.givenName || '',
          lastName: names.familyName || '',
          email: email,
          phone: phones[0]?.value || '',
          company: orgs[0]?.name || '',
          jobTitle: orgs[0]?.title || '',
        });
      }
      
      nextPageToken = data.nextPageToken;
    } while (nextPageToken && contacts.length < 500); // Cap at 500
    
    return NextResponse.json({
      success: true,
      contacts,
      total: contacts.length,
    });
    
  } catch (error: unknown) {
    console.error('Error fetching Google Contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Contacts' },
      { status: 500 }
    );
  }
}

// POST — import selected Google contacts
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    const { contacts, skipDuplicates = true } = await request.json() as {
      contacts: GoogleContact[];
      skipDuplicates?: boolean;
    };
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts to import' }, { status: 400 });
    }
    
    // Get existing emails for duplicate detection
    const existingEmails = new Set<string>();
    if (skipDuplicates) {
      const snapshot = await adminDb.collection('contacts').select('email').get();
      snapshot.forEach(doc => {
        const email = doc.data().email;
        if (email) existingEmails.add(email.toLowerCase());
      });
    }
    
    const now = new Date().toISOString();
    let imported = 0;
    let skipped = 0;
    const duplicates: string[] = [];
    const batch = adminDb.batch();
    let batchCount = 0;
    
    for (const contact of contacts) {
      if (!contact.email) {
        skipped++;
        continue;
      }
      
      const email = contact.email.toLowerCase();
      
      if (skipDuplicates && existingEmails.has(email)) {
        duplicates.push(email);
        skipped++;
        continue;
      }
      
      const docRef = adminDb.collection('contacts').doc();
      batch.set(docRef, {
        firstName: contact.firstName || contact.name?.split(' ')[0] || '',
        lastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
        email: email,
        phone: contact.phone || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        type: 'lead',
        tags: ['google-import'],
        customFields: {},
        lifetimeValue: 0,
        projectCount: 0,
        outstandingAmount: 0,
        createdAt: now,
        updatedAt: now,
        source: 'google-contacts',
      });
      
      existingEmails.add(email);
      imported++;
      batchCount++;
      
      if (batchCount >= 450) {
        await batch.commit();
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    return NextResponse.json({
      imported,
      skipped,
      duplicates,
      total: contacts.length,
    });
    
  } catch (error: unknown) {
    console.error('Error importing Google Contacts:', error);
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    );
  }
}
