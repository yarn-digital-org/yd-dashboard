import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { parseCSV, autoMapFields, CSVParseResult } from '@/lib/csv';

export interface ImportPreviewResult {
  headers: string[];
  suggestedMapping: Record<string, string>;
  preview: Record<string, any>[];
  totalRows: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  duplicates: string[];
  errors: { row: number; error: string }[];
}

// POST - Import contacts from CSV
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    // Handle preview request
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const action = formData.get('action') as string;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const content = await file.text();
      const parsed = parseCSV(content);
      
      if (parsed.headers.length === 0) {
        return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
      }

      if (action === 'preview') {
        const suggestedMapping = autoMapFields(parsed.headers);
        const preview = parsed.rows.slice(0, 5).map(row => {
          const obj: Record<string, string> = {};
          parsed.headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
          return obj;
        });

        return NextResponse.json({
          headers: parsed.headers,
          suggestedMapping,
          preview,
          totalRows: parsed.rowCount
        } as ImportPreviewResult);
      }
    }

    // Handle actual import
    const body = await request.json();
    const { rows, mapping, skipDuplicates = true } = body as {
      rows: Record<string, string>[];
      mapping: Record<string, string>;
      skipDuplicates?: boolean;
    };

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'No data to import' }, { status: 400 });
    }

    if (!mapping || typeof mapping !== 'object') {
      return NextResponse.json({ error: 'Field mapping is required' }, { status: 400 });
    }

    // Validate required fields are mapped
    const requiredFields = ['firstName', 'lastName', 'email'];
    const mappedFields = Object.values(mapping);
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));
    
    if (missingRequired.length > 0) {
      return NextResponse.json({ 
        error: `Missing required field mappings: ${missingRequired.join(', ')}` 
      }, { status: 400 });
    }

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      duplicates: [],
      errors: []
    };

    const batch = adminDb.batch();
    const now = new Date().toISOString();
    let batchCount = 0;

    // Get existing emails for duplicate detection
    const existingEmails = new Set<string>();
    if (skipDuplicates) {
      const snapshot = await adminDb.collection('contacts').select('email').get();
      snapshot.forEach(doc => {
        const email = doc.data().email;
        if (email) existingEmails.add(email.toLowerCase());
      });
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Map row to contact fields
        const contact: Record<string, any> = {
          tags: [],
          customFields: {},
          lifetimeValue: 0,
          projectCount: 0,
          outstandingAmount: 0,
          createdAt: now,
          updatedAt: now,
        };

        // Address sub-fields
        const address: Record<string, string> = {};
        const socialLinks: Record<string, string> = {};

        for (const [csvHeader, contactField] of Object.entries(mapping)) {
          if (!contactField) continue;
          
          const value = row[csvHeader]?.trim() || '';
          
          // Handle nested fields
          if (['street', 'city', 'state', 'zip', 'country'].includes(contactField)) {
            address[contactField] = value;
          } else if (['linkedin', 'twitter', 'instagram'].includes(contactField)) {
            socialLinks[contactField] = value;
          } else if (contactField === 'tags') {
            // Parse comma-separated tags
            contact.tags = value ? value.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
          } else if (contactField === 'type') {
            // Validate type
            const validTypes = ['lead', 'client', 'past_client', 'vendor', 'other'];
            const normalizedType = value.toLowerCase().replace(/\s+/g, '_');
            contact.type = validTypes.includes(normalizedType) ? normalizedType : 'other';
          } else {
            contact[contactField] = value;
          }
        }

        if (Object.keys(address).length > 0) {
          contact.address = address;
        }
        if (Object.keys(socialLinks).length > 0) {
          contact.socialLinks = socialLinks;
        }

        // Set defaults
        if (!contact.type) contact.type = 'lead';

        // Validate required fields
        if (!contact.firstName || !contact.lastName || !contact.email) {
          result.errors.push({ row: i + 1, error: 'Missing required fields (firstName, lastName, or email)' });
          result.skipped++;
          continue;
        }

        // Normalize email
        contact.email = contact.email.toLowerCase();

        // Check for duplicates
        if (skipDuplicates && existingEmails.has(contact.email)) {
          result.duplicates.push(contact.email);
          result.skipped++;
          continue;
        }

        // Add to batch
        const docRef = adminDb.collection('contacts').doc();
        batch.set(docRef, contact);
        existingEmails.add(contact.email);
        batchCount++;
        result.imported++;

        // Firestore batch limit is 500
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }

      } catch (error: unknown) {
        result.errors.push({ row: i + 1, error: error instanceof Error ? error.message : "Import failed" });
        result.skipped++;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error importing contacts:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
