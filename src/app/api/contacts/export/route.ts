import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateCSV } from '@/lib/csv';

// GET - Export contacts as CSV
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const ids = searchParams.get('ids'); // Comma-separated IDs for selective export
    const format = searchParams.get('format') || 'csv';

    let contacts: any[] = [];

    if (ids) {
      // Export specific contacts by ID
      const idList = ids.split(',').filter(Boolean);
      const chunks = [];
      
      // Firestore 'in' query limit is 10
      for (let i = 0; i < idList.length; i += 10) {
        chunks.push(idList.slice(i, i + 10));
      }
      
      for (const chunk of chunks) {
        const snapshot = await adminDb.collection('contacts')
          .where('__name__', 'in', chunk)
          .get();
        contacts.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } else {
      // Export all contacts with optional filtering
      let query: FirebaseFirestore.Query = adminDb.collection('contacts').orderBy('createdAt', 'desc');
      
      if (type && type !== 'all') {
        query = query.where('type', '==', type);
      }

      const snapshot = await query.get();
      contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter by tag post-query
      if (tag) {
        contacts = contacts.filter(c => c.tags?.includes(tag));
      }
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts to export' }, { status: 404 });
    }

    // Define export columns
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Job Title',
      'Website',
      'Street',
      'City',
      'State',
      'Postal Code',
      'Country',
      'Type',
      'Tags',
      'LinkedIn',
      'Twitter',
      'Instagram',
      'Notes',
      'Lifetime Value',
      'Project Count',
      'Created At'
    ];

    // Map contacts to rows
    const rows = contacts.map(contact => [
      contact.firstName || '',
      contact.lastName || '',
      contact.email || '',
      contact.phone || '',
      contact.company || '',
      contact.jobTitle || '',
      contact.website || '',
      contact.address?.street || '',
      contact.address?.city || '',
      contact.address?.state || '',
      contact.address?.zip || '',
      contact.address?.country || '',
      contact.type || '',
      (contact.tags || []).join(', '),
      contact.socialLinks?.linkedin || '',
      contact.socialLinks?.twitter || '',
      contact.socialLinks?.instagram || '',
      contact.notes || '',
      contact.lifetimeValue || 0,
      contact.projectCount || 0,
      contact.createdAt || ''
    ]);

    const csv = generateCSV(headers, rows);
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `contacts-export-${date}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: unknown) {
    console.error('Error exporting contacts:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
