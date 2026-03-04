import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Contact type definitions
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  website?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  avatarUrl?: string;
  type: 'lead' | 'client' | 'past_client' | 'vendor' | 'other';
  tags: string[];
  customFields: Record<string, any>;
  lifetimeValue: number;
  projectCount: number;
  outstandingAmount: number;
  lastContactedAt?: string;
  leadId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// GET - List all contacts with filtering
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query: FirebaseFirestore.Query = adminDb.collection('contacts').orderBy('createdAt', 'desc');

    // Filter by type
    if (type && type !== 'all') {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();
    let contacts = snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Contact[];

    // Filter by tag (post-query since Firestore doesn't support array-contains with other filters well)
    if (tag) {
      contacts = contacts.filter(c => c.tags?.includes(tag));
    }

    // Search filter (post-query for flexibility)
    if (search) {
      contacts = contacts.filter(c => 
        c.firstName?.toLowerCase().includes(search) ||
        c.lastName?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.company?.toLowerCase().includes(search) ||
        c.phone?.includes(search)
      );
    }

    // Pagination
    const total = contacts.length;
    contacts = contacts.slice(offset, offset + limit);

    return NextResponse.json({ 
      contacts, 
      total,
      limit,
      offset,
      hasMore: offset + contacts.length < total
    });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new contact
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const data = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      company, 
      jobTitle,
      address,
      website,
      socialLinks,
      type,
      tags,
      notes,
      customFields
    } = data;

    // Validation
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check for duplicate email
    const existing = await adminDb.collection('contacts')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();
    
    if (!existing.empty) {
      return NextResponse.json({ 
        error: 'A contact with this email already exists',
        duplicateId: existing.docs[0].id 
      }, { status: 409 });
    }

    const now = new Date().toISOString();
    
    const contact: Omit<Contact, 'id'> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      company: company?.trim() || '',
      jobTitle: jobTitle?.trim() || '',
      address: address || {},
      website: website?.trim() || '',
      socialLinks: socialLinks || {},
      avatarUrl: '',
      type: type || 'client',
      tags: tags || [],
      customFields: customFields || {},
      notes: notes?.trim() || '',
      lifetimeValue: 0,
      projectCount: 0,
      outstandingAmount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('contacts').add(contact);

    // Fire automations for new contact
    try {
      const { fireAutomations } = await import('@/lib/automation-engine');
      await fireAutomations('new_contact', {
        id: docRef.id,
        _collection: 'contacts',
        ...contact,
      }, (contact as any).userId || 'demo-user');
    } catch (e) {
      console.error('Automation trigger error:', e);
    }
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...contact,
      message: 'Contact created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
