import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  successResponse,
  errorResponse,
  validateBody,
  validateQuery,
  requireDb,
  AuthUser,
  ValidationError
} from '@/lib/api-middleware';

// Contact type definitions
export interface Contact {
  id: string;
  userId: string;
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

const getContactsQuerySchema = z.object({
  type: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  address: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    zip: z.string().max(20).optional(),
    country: z.string().max(50).optional(),
  }).optional(),
  website: z.string().url('Invalid website URL').or(z.literal('')).optional(),
  socialLinks: z.object({
    instagram: z.string().max(200).optional(),
    linkedin: z.string().max(200).optional(),
    twitter: z.string().max(200).optional(),
  }).optional(),
  type: z.enum(['lead', 'client', 'past_client', 'vendor', 'other']).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(1000).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

// GET - List all contacts with filtering
async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const query = validateQuery(request, getContactsQuerySchema);

  // Base query - scoped to user
  let firebaseQuery: FirebaseFirestore.Query = db
    .collection('contacts')
    .where('userId', '==', user.userId)
    .orderBy('createdAt', 'desc');

  // Filter by type
  if (query.type && query.type !== 'all') {
    firebaseQuery = firebaseQuery.where('type', '==', query.type);
  }

  const snapshot = await firebaseQuery.get();
  let contacts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Contact[];

  // Filter by tag (post-query since Firestore doesn't support array-contains with other filters well)
  if (query.tag) {
    contacts = contacts.filter(c => c.tags?.includes(query.tag!));
  }

  // Search filter (post-query for flexibility)
  if (query.search) {
    const search = query.search.toLowerCase();
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
  contacts = contacts.slice(query.offset, query.offset + query.limit);

  return successResponse({
    contacts,
    total,
    limit: query.limit,
    offset: query.offset,
    hasMore: query.offset + contacts.length < total
  });
}

// POST - Create new contact
async function handlePost(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const data = await validateBody(request, createContactSchema);

  // Check for duplicate email (within user's contacts)
  const existing = await db
    .collection('contacts')
    .where('userId', '==', user.userId)
    .where('email', '==', data.email.toLowerCase().trim())
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new ValidationError('A contact with this email already exists', {
      email: ['Duplicate email address'],
    });
  }

  const now = new Date().toISOString();

  const contact: Omit<Contact, 'id'> = {
    userId: user.userId,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.toLowerCase().trim(),
    phone: data.phone?.trim() || '',
    company: data.company?.trim() || '',
    jobTitle: data.jobTitle?.trim() || '',
    address: data.address || {},
    website: data.website?.trim() || '',
    socialLinks: data.socialLinks || {},
    avatarUrl: '',
    type: data.type || 'client',
    tags: data.tags || [],
    customFields: data.customFields || {},
    notes: data.notes?.trim() || '',
    lifetimeValue: 0,
    projectCount: 0,
    outstandingAmount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection('contacts').add(contact);

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

  return successResponse({ id: docRef.id, ...contact }, 201);
}

// Export handlers with auth wrapper
export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
