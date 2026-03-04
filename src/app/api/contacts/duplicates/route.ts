import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export interface DuplicateGroup {
  matchType: 'email' | 'phone' | 'name';
  matchValue: string;
  contacts: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    type: string;
    createdAt: string;
  }[];
}

export interface DuplicateResult {
  groups: DuplicateGroup[];
  totalDuplicates: number;
}

// GET - Find potential duplicate contacts
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const matchTypes = searchParams.get('matchTypes')?.split(',') || ['email', 'phone', 'name'];

    // Fetch all contacts
    const snapshot = await adminDb.collection('contacts').get();
    const contacts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const groups: DuplicateGroup[] = [];

    // Helper to normalize strings for comparison
    const normalize = (str: string | undefined): string => {
      return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
    };

    // Check for email duplicates
    if (matchTypes.includes('email')) {
      const emailMap = new Map<string, any[]>();
      
      for (const contact of contacts) {
        if (contact.email) {
          const normalizedEmail = normalize(contact.email);
          if (!emailMap.has(normalizedEmail)) {
            emailMap.set(normalizedEmail, []);
          }
          emailMap.get(normalizedEmail)!.push(contact);
        }
      }

      for (const [email, dupes] of emailMap) {
        if (dupes.length > 1) {
          groups.push({
            matchType: 'email',
            matchValue: email,
            contacts: dupes.map(c => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              email: c.email,
              phone: c.phone,
              company: c.company,
              type: c.type,
              createdAt: c.createdAt
            }))
          });
        }
      }
    }

    // Check for phone duplicates
    if (matchTypes.includes('phone')) {
      const phoneMap = new Map<string, any[]>();
      
      // Normalize phone: remove all non-digits
      const normalizePhone = (phone: string | undefined): string => {
        return (phone || '').replace(/\D/g, '');
      };

      for (const contact of contacts) {
        if (contact.phone) {
          const normalizedPhone = normalizePhone(contact.phone);
          if (normalizedPhone.length >= 7) { // Only consider valid phone numbers
            if (!phoneMap.has(normalizedPhone)) {
              phoneMap.set(normalizedPhone, []);
            }
            phoneMap.get(normalizedPhone)!.push(contact);
          }
        }
      }

      for (const [phone, dupes] of phoneMap) {
        if (dupes.length > 1) {
          // Don't add if same contacts are already in an email group
          const contactIds = dupes.map(c => c.id).sort().join(',');
          const existingGroup = groups.find(g => 
            g.contacts.map(c => c.id).sort().join(',') === contactIds
          );
          
          if (!existingGroup) {
            groups.push({
              matchType: 'phone',
              matchValue: phone,
              contacts: dupes.map(c => ({
                id: c.id,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                phone: c.phone,
                company: c.company,
                type: c.type,
                createdAt: c.createdAt
              }))
            });
          }
        }
      }
    }

    // Check for name duplicates (fuzzy matching)
    if (matchTypes.includes('name')) {
      const nameMap = new Map<string, any[]>();
      
      for (const contact of contacts) {
        if (contact.firstName && contact.lastName) {
          const fullName = `${normalize(contact.firstName)} ${normalize(contact.lastName)}`;
          if (!nameMap.has(fullName)) {
            nameMap.set(fullName, []);
          }
          nameMap.get(fullName)!.push(contact);
        }
      }

      for (const [name, dupes] of nameMap) {
        if (dupes.length > 1) {
          // Don't add if contacts differ by email (likely different people with same name)
          const uniqueEmails = new Set(dupes.map(c => normalize(c.email)).filter(Boolean));
          if (uniqueEmails.size < dupes.length) {
            // Some emails are the same, likely true duplicates
            const contactIds = dupes.map(c => c.id).sort().join(',');
            const existingGroup = groups.find(g => 
              g.contacts.map(c => c.id).sort().join(',') === contactIds
            );
            
            if (!existingGroup) {
              groups.push({
                matchType: 'name',
                matchValue: name,
                contacts: dupes.map(c => ({
                  id: c.id,
                  firstName: c.firstName,
                  lastName: c.lastName,
                  email: c.email,
                  phone: c.phone,
                  company: c.company,
                  type: c.type,
                  createdAt: c.createdAt
                }))
              });
            }
          }
        }
      }
    }

    // Sort groups by number of duplicates (most duplicates first)
    groups.sort((a, b) => b.contacts.length - a.contacts.length);

    const totalDuplicates = groups.reduce((sum, g) => sum + g.contacts.length - 1, 0);

    return NextResponse.json({
      groups,
      totalDuplicates
    } as DuplicateResult);

  } catch (error: unknown) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST - Merge duplicate contacts
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { primaryId, mergeIds } = await request.json();

    if (!primaryId || !mergeIds || !Array.isArray(mergeIds) || mergeIds.length === 0) {
      return NextResponse.json({ 
        error: 'Primary ID and merge IDs are required' 
      }, { status: 400 });
    }

    // Fetch primary contact
    const primaryDoc = await adminDb.collection('contacts').doc(primaryId).get();
    if (!primaryDoc.exists) {
      return NextResponse.json({ error: 'Primary contact not found' }, { status: 404 });
    }

    const primaryData = primaryDoc.data()!;

    // Fetch contacts to merge
    const mergeContacts: any[] = [];
    for (const id of mergeIds) {
      const doc = await adminDb.collection('contacts').doc(id).get();
      if (doc.exists) {
        mergeContacts.push({ id: doc.id, ...doc.data() });
      }
    }

    // Merge data: keep primary values, fill in blanks from others
    const mergedData = { ...primaryData };
    
    for (const contact of mergeContacts) {
      // Fill in empty fields from merged contacts
      const fieldsToMerge = ['phone', 'company', 'jobTitle', 'website', 'notes'];
      for (const field of fieldsToMerge) {
        if (!mergedData[field] && contact[field]) {
          mergedData[field] = contact[field];
        }
      }

      // Merge tags
      if (contact.tags?.length) {
        const existingTags = new Set(mergedData.tags || []);
        contact.tags.forEach((tag: string) => existingTags.add(tag));
        mergedData.tags = Array.from(existingTags);
      }

      // Merge social links
      if (contact.socialLinks) {
        mergedData.socialLinks = mergedData.socialLinks || {};
        for (const [key, value] of Object.entries(contact.socialLinks)) {
          if (!mergedData.socialLinks[key] && value) {
            mergedData.socialLinks[key] = value;
          }
        }
      }

      // Merge address
      if (contact.address) {
        mergedData.address = mergedData.address || {};
        for (const [key, value] of Object.entries(contact.address)) {
          if (!mergedData.address[key] && value) {
            mergedData.address[key] = value;
          }
        }
      }

      // Combine lifetime values and project counts
      mergedData.lifetimeValue = (mergedData.lifetimeValue || 0) + (contact.lifetimeValue || 0);
      mergedData.projectCount = (mergedData.projectCount || 0) + (contact.projectCount || 0);
    }

    mergedData.updatedAt = new Date().toISOString();

    // Update primary contact and delete merged contacts
    const batch = adminDb.batch();
    batch.update(adminDb.collection('contacts').doc(primaryId), mergedData);
    
    for (const id of mergeIds) {
      batch.delete(adminDb.collection('contacts').doc(id));
    }

    await batch.commit();

    return NextResponse.json({
      message: `Merged ${mergeIds.length} contacts into primary contact`,
      contact: { id: primaryId, ...mergedData }
    });

  } catch (error: unknown) {
    console.error('Error merging contacts:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
