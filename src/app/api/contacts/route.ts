import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-middleware';
import { z } from 'zod';

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
  customFields: Record<string, unknown>;
  lifetimeValue: number;
  projectCount: number;
  outstandingAmount: number;
  lastContactedAt?: string;
  leadId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).transform(s => s.trim()),
  lastName: z.string().min(1, 'Last name is required').max(100).transform(s => s.trim()),
  email: z.string().email('Invalid email').max(255).transform(s => s.toLowerCase().trim()),
  phone: z.string().max(50).optional().default(''),
  company: z.string().max(200).optional().default(''),
  jobTitle: z.string().max(200).optional().default(''),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional().default({}),
  website: z.string().max(500).optional().default(''),
  socialLinks: z.object({
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  }).optional().default({}),
  type: z.enum(['lead', 'client', 'past_client', 'vendor', 'other']).optional().default('client'),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(5000).optional().default(''),
  customFields: z.record(z.string(), z.unknown()).optional().default({}),
});

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
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100'), 1), 500);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

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
  } catch (error: unknown) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST - Create new contact
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Authenticate the user
    const user = await verifyAuth(request);

    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const data = parsed.data;

    // Check for duplicate email
    const existing = await adminDb.collection('contacts')
      .where('email', '==', data.email)
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
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
      company: data.company || '',
      jobTitle: data.jobTitle || '',
      address: data.address || {},
      website: data.website || '',
      socialLinks: data.socialLinks || {},
      avatarUrl: '',
      type: data.type || 'client',
      tags: data.tags || [],
      customFields: data.customFields || {},
      notes: data.notes || '',
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
      }, user.userId);
    } catch (e) {
      console.error('Automation trigger error:', e);
    }
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...contact,
      message: 'Contact created successfully'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating contact:', error);
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiErr = error as { statusCode: number; message: string };
      return NextResponse.json({ error: apiErr.message }, { status: apiErr.statusCode });
    }
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
