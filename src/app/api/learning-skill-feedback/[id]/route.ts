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
  resolveOrgId,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';
import type {
  SkillSuggestion,
  ImplementSkillSuggestionRequest,
  ImplementSkillSuggestionResponse,
  LearningSkillRelationship,
} from '@/types/learning-skill-feedback';

// ============================================
// Validation Schemas
// ============================================

const implementSuggestionSchema = z.object({
  customizations: z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().min(10).max(500).optional(),
    category: z.enum(['Content', 'SEO', 'Development', 'Marketing', 'Design', 'Analytics', 'Operations']).optional(),
    content: z.string().min(50).optional(),
    tags: z.array(z.string()).max(10).optional(),
  }).optional(),
});

const updateSuggestionSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'implemented']).optional(),
  reviewNotes: z.string().max(1000).optional(),
});

// ============================================
// PUT - Implement skill suggestion (create skill from suggestion)
// ============================================

async function handlePut(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id: suggestionId } = await context.params;
  const orgId = await resolveOrgId(user);

  // Check if this is an implementation request or status update
  const bodyText = await request.text();
  let body;
  
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = {};
  }

  // If customizations are provided, this is an implementation request
  if (body.customizations !== undefined) {
    const validatedBody = implementSuggestionSchema.parse(body) as ImplementSkillSuggestionRequest;
    
    // Get the suggestion
    const suggestionRef = db.collection(COLLECTIONS.SKILL_SUGGESTIONS || 'skillSuggestions').doc(suggestionId);
    const suggestionDoc = await suggestionRef.get();

    if (!suggestionDoc.exists) {
      throw new NotFoundError('Skill suggestion not found');
    }

    const suggestion = { id: suggestionDoc.id, ...suggestionDoc.data() } as SkillSuggestion;

    if (suggestion.orgId !== orgId) {
      throw new ForbiddenError('Access denied');
    }

    if (suggestion.status === 'implemented') {
      throw new Error('Suggestion has already been implemented');
    }

    if (suggestion.status === 'rejected') {
      throw new Error('Cannot implement rejected suggestion');
    }

    const now = new Date().toISOString();

    // Create the skill with customizations or defaults
    const skillData = {
      orgId,
      name: validatedBody.customizations?.name || suggestion.suggestedSkillName,
      description: validatedBody.customizations?.description || suggestion.suggestedSkillDescription,
      category: validatedBody.customizations?.category || suggestion.suggestedSkillCategory,
      content: validatedBody.customizations?.content || suggestion.suggestedSkillContent,
      tags: validatedBody.customizations?.tags || suggestion.suggestedTags,
      agentIds: [], // Start with no assigned agents
      source: 'internal' as const,
      createdAt: now,
      updatedAt: now,
    };

    // Create the skill in Firestore
    const skillRef = await db.collection(COLLECTIONS.SKILLS).add(skillData);

    // Create the learning-skill relationship
    const relationshipData: Omit<LearningSkillRelationship, 'id'> = {
      orgId,
      learningId: suggestion.learningId,
      skillId: skillRef.id,
      relationshipType: 'generated_from',
      createdAt: now,
    };

    const relationshipRef = await db
      .collection(COLLECTIONS.LEARNING_SKILL_RELATIONSHIPS || 'learningSkillRelationships')
      .add(relationshipData);

    // Update the suggestion to mark it as implemented
    await suggestionRef.update({
      status: 'implemented',
      implementedAt: now,
      resultingSkillId: skillRef.id,
      reviewedBy: user.userId,
      reviewedAt: now,
      updatedAt: now,
    });

    // Fetch the created skill with ID
    const createdSkill = {
      id: skillRef.id,
      ...skillData,
    };

    return successResponse<ImplementSkillSuggestionResponse>({
      skillId: skillRef.id,
      suggestionId,
      relationshipId: relationshipRef.id,
      skill: createdSkill,
    });

  } else {
    // This is a status update request
    const validatedBody = updateSuggestionSchema.parse(body);
    
    const suggestionRef = db.collection(COLLECTIONS.SKILL_SUGGESTIONS || 'skillSuggestions').doc(suggestionId);
    const suggestionDoc = await suggestionRef.get();

    if (!suggestionDoc.exists) {
      throw new NotFoundError('Skill suggestion not found');
    }

    const suggestion = { id: suggestionDoc.id, ...suggestionDoc.data() } as SkillSuggestion;

    if (suggestion.orgId !== orgId) {
      throw new ForbiddenError('Access denied');
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updatedAt: now,
    };

    if (validatedBody.status) {
      updateData.status = validatedBody.status;
      
      if (validatedBody.status === 'approved' || validatedBody.status === 'rejected') {
        updateData.reviewedBy = user.userId;
        updateData.reviewedAt = now;
      }
    }

    if (validatedBody.reviewNotes) {
      updateData.reviewNotes = validatedBody.reviewNotes;
    }

    await suggestionRef.update(updateData);

    const updatedSuggestion = {
      ...suggestion,
      ...updateData,
    };

    return successResponse(updatedSuggestion);
  }
}

// ============================================
// GET - Get specific skill suggestion
// ============================================

async function handleGet(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id: suggestionId } = await context.params;
  const orgId = await resolveOrgId(user);

  const suggestionRef = db.collection(COLLECTIONS.SKILL_SUGGESTIONS || 'skillSuggestions').doc(suggestionId);
  const suggestionDoc = await suggestionRef.get();

  if (!suggestionDoc.exists) {
    throw new NotFoundError('Skill suggestion not found');
  }

  const suggestion = { id: suggestionDoc.id, ...suggestionDoc.data() } as SkillSuggestion;

  if (suggestion.orgId !== orgId) {
    throw new ForbiddenError('Access denied');
  }

  // If implemented, also fetch the resulting skill
  let resultingSkill = null;
  if (suggestion.resultingSkillId) {
    const skillDoc = await db.collection(COLLECTIONS.SKILLS).doc(suggestion.resultingSkillId).get();
    if (skillDoc.exists) {
      resultingSkill = { id: skillDoc.id, ...skillDoc.data() };
    }
  }

  return successResponse({
    suggestion,
    resultingSkill,
  });
}

// ============================================
// DELETE - Delete/reject skill suggestion
// ============================================

async function handleDelete(
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const { id: suggestionId } = await context.params;
  const orgId = await resolveOrgId(user);

  const suggestionRef = db.collection(COLLECTIONS.SKILL_SUGGESTIONS || 'skillSuggestions').doc(suggestionId);
  const suggestionDoc = await suggestionRef.get();

  if (!suggestionDoc.exists) {
    throw new NotFoundError('Skill suggestion not found');
  }

  const suggestion = { id: suggestionDoc.id, ...suggestionDoc.data() } as SkillSuggestion;

  if (suggestion.orgId !== orgId) {
    throw new ForbiddenError('Access denied');
  }

  if (suggestion.status === 'implemented') {
    throw new Error('Cannot delete implemented suggestion');
  }

  // Mark as rejected rather than actually deleting
  const now = new Date().toISOString();
  await suggestionRef.update({
    status: 'rejected',
    reviewedBy: user.userId,
    reviewedAt: now,
    updatedAt: now,
  });

  return successResponse({
    message: 'Skill suggestion rejected',
    suggestionId,
  });
}

// ============================================
// Route Handlers
// ============================================

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);