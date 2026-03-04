import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  successResponse,
  handleApiError,
  validateBody,
  requireDb,
  AuthUser,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-middleware';
import { Lead, LeadStatus, LeadPriority, Note, COLLECTIONS } from '@/types';

// ============================================
// Validation Schemas
// ============================================

const updateLeadSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  service: z.string().optional(),
  budgetMin: z.number().optional().nullable(),
  budgetMax: z.number().optional().nullable(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.array(z.object({
    id: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  })).optional(),
});

type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

// ============================================
// GET - Get single lead
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  const doc = await db.collection(COLLECTIONS.LEADS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Lead not found');
  }

  const lead = { id: doc.id, ...doc.data() } as Lead;

  // Verify ownership
  if (lead.userId !== user.userId) {
    throw new ForbiddenError('You do not have access to this lead');
  }

  return successResponse(lead);
}

// ============================================
// PUT - Update lead
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  const data = await validateBody(request, updateLeadSchema);

  // Get existing lead
  const doc = await db.collection(COLLECTIONS.LEADS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Lead not found');
  }

  const existingLead = { id: doc.id, ...doc.data() } as Lead;

  // Verify ownership
  if (existingLead.userId !== user.userId) {
    throw new ForbiddenError('You do not have access to this lead');
  }

  // Build update object
  const updates: Partial<Lead> & { updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.email !== undefined) updates.email = data.email.toLowerCase().trim();
  if (data.phone !== undefined) updates.phone = data.phone.trim() || undefined;
  if (data.company !== undefined) updates.company = data.company.trim() || undefined;
  if (data.service !== undefined) updates.service = data.service.trim() || undefined;
  if (data.budgetMin !== undefined) updates.budgetMin = data.budgetMin ?? undefined;
  if (data.budgetMax !== undefined) updates.budgetMax = data.budgetMax ?? undefined;
  if (data.source !== undefined) updates.source = data.source;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.notes !== undefined) updates.notes = data.notes;

  await db.collection(COLLECTIONS.LEADS).doc(id).update(updates);

  // Fetch updated document
  const updatedDoc = await db.collection(COLLECTIONS.LEADS).doc(id).get();
  const updatedLead = { id: updatedDoc.id, ...updatedDoc.data() } as Lead;

  return successResponse(updatedLead);
}

// ============================================
// PATCH - Partial update (status change, add note, etc.)
// ============================================

const patchSchema = z.object({
  action: z.enum(['update_status', 'add_note', 'update_note', 'delete_note', 'add_tag', 'remove_tag']),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  note: z.object({
    id: z.string().optional(),
    content: z.string(),
  }).optional(),
  noteId: z.string().optional(),
  tag: z.string().optional(),
});

async function handlePatch(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;
  const data = await validateBody(request, patchSchema);

  // Get existing lead
  const doc = await db.collection(COLLECTIONS.LEADS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Lead not found');
  }

  const existingLead = { id: doc.id, ...doc.data() } as Lead;

  // Verify ownership
  if (existingLead.userId !== user.userId) {
    throw new ForbiddenError('You do not have access to this lead');
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  switch (data.action) {
    case 'update_status':
      if (data.status) updates.status = data.status;
      if (data.priority) updates.priority = data.priority;
      break;

    case 'add_note':
      if (data.note) {
        const newNote: Note = {
          id: crypto.randomUUID(),
          content: data.note.content,
          createdAt: now,
        };
        const currentNotes = existingLead.notes || [];
        updates.notes = [newNote, ...currentNotes];
      }
      break;

    case 'update_note':
      if (data.note?.id && data.note.content) {
        const notes = (existingLead.notes || []).map((note) =>
          note.id === data.note!.id
            ? { ...note, content: data.note!.content, updatedAt: now }
            : note
        );
        updates.notes = notes;
      }
      break;

    case 'delete_note':
      if (data.noteId) {
        const notes = (existingLead.notes || []).filter(
          (note) => note.id !== data.noteId
        );
        updates.notes = notes;
      }
      break;

    case 'add_tag':
      if (data.tag) {
        const currentTags = existingLead.tags || [];
        if (!currentTags.includes(data.tag)) {
          updates.tags = [...currentTags, data.tag];
        }
      }
      break;

    case 'remove_tag':
      if (data.tag) {
        const currentTags = existingLead.tags || [];
        updates.tags = currentTags.filter((t) => t !== data.tag);
      }
      break;
  }

  await db.collection(COLLECTIONS.LEADS).doc(id).update(updates);

  // Fetch updated document
  const updatedDoc = await db.collection(COLLECTIONS.LEADS).doc(id).get();
  const updatedLead = { id: updatedDoc.id, ...updatedDoc.data() } as Lead;

  return successResponse(updatedLead);
}

// ============================================
// DELETE - Delete lead
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id } = await context.params;

  // Get existing lead
  const doc = await db.collection(COLLECTIONS.LEADS).doc(id).get();

  if (!doc.exists) {
    throw new NotFoundError('Lead not found');
  }

  const existingLead = { id: doc.id, ...doc.data() } as Lead;

  // Verify ownership
  if (existingLead.userId !== user.userId) {
    throw new ForbiddenError('You do not have access to this lead');
  }

  await db.collection(COLLECTIONS.LEADS).doc(id).delete();

  return successResponse({ deleted: true, id });
}

// ============================================
// Export handlers with auth wrapper
// ============================================

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const PATCH = withAuth(handlePatch);
export const DELETE = withAuth(handleDelete);
