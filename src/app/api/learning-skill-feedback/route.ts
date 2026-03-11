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
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';
import {
  SkillSuggestion,
  GenerateSkillSuggestionRequest,
  GenerateSkillSuggestionResponse,
  DEFAULT_SUGGESTION_CRITERIA,
  DEFAULT_CATEGORY_MAPPINGS,
  SuggestionCriteria,
} from '@/types/learning-skill-feedback';

// ============================================
// Validation Schemas
// ============================================

const generateSuggestionsSchema = z.object({
  learningId: z.string().min(1, 'Learning ID is required'),
  criteria: z.object({
    minImpactLevel: z.enum(['high', 'medium', 'low']).optional(),
    requireActionable: z.boolean().optional(),
    minTagOverlap: z.number().min(0).optional(),
    excludeCategories: z.array(z.enum(['seo', 'development', 'design', 'marketing', 'client-management'])).optional(),
    maxSuggestionsPerLearning: z.number().min(1).max(10).optional(),
    confidenceThreshold: z.number().min(0).max(1).optional(),
  }).optional(),
});

// ============================================
// Helper Functions
// ============================================

function calculateConfidenceScore(
  learning: any,
  existingSkills: any[],
  criteria: SuggestionCriteria
): number {
  let confidence = 0.5; // base confidence

  // Impact level boost
  if (learning.impact === 'high') confidence += 0.3;
  else if (learning.impact === 'medium') confidence += 0.15;

  // Actionable learning boost
  if (learning.actionable) confidence += 0.2;

  // Tag overlap with existing skills (reduce confidence if too similar)
  const learningTags = learning.tags || [];
  const tagOverlaps = existingSkills.map(skill => {
    const skillTags = skill.tags || [];
    return learningTags.filter((tag: string) => skillTags.includes(tag)).length;
  });
  const maxOverlap = Math.max(...tagOverlaps, 0);
  if (maxOverlap > 3) confidence -= 0.1; // reduce if too similar to existing

  // Description length and quality (more detailed = higher confidence)
  const descLength = learning.description?.length || 0;
  if (descLength > 500) confidence += 0.1;
  else if (descLength < 100) confidence -= 0.1;

  // Ensure confidence stays within bounds
  return Math.max(0, Math.min(1, confidence));
}

function generateSkillContent(learning: any, category: string): string {
  return `# ${learning.title}

## Overview
This skill was generated from a ${learning.impact}-impact learning in the ${learning.category} category.

${learning.description}

## Application
${learning.actionable ? 
  'This is an actionable learning that should be applied in future projects.' : 
  'This learning provides valuable context and insights for future reference.'}

## Tags
${(learning.tags || []).map((tag: string) => `- ${tag}`).join('\n')}

${learning.client ? `\n## Original Context\nLearned while working with: ${learning.client}` : ''}
${learning.project ? `\nProject: ${learning.project}` : ''}

## Implementation Notes
- Review this skill when starting similar ${category.toLowerCase()} work
- Consider this approach when facing similar challenges
- Update this skill as we learn more about this topic

## Related Learnings
This skill was generated from Learning ID: ${learning.id}
Created: ${new Date().toISOString()}`;
}

function determinePriority(learning: any, confidence: number): 'high' | 'medium' | 'low' {
  if (learning.impact === 'high' && confidence > 0.8) return 'high';
  if (learning.impact === 'high' || confidence > 0.7) return 'medium';
  return 'low';
}

function mapLearningToSkillCategory(learningCategory: string): string {
  const mapping = DEFAULT_CATEGORY_MAPPINGS.find(m => m.learningCategory === learningCategory);
  if (mapping && mapping.preferredSkillCategories.length > 0) {
    return mapping.preferredSkillCategories[0]; // Take first preference
  }
  
  // Fallback mapping
  switch (learningCategory) {
    case 'seo': return 'SEO';
    case 'development': return 'Development';
    case 'design': return 'Design';
    case 'marketing': return 'Marketing';
    case 'client-management': return 'Operations';
    default: return 'Operations';
  }
}

// ============================================
// POST - Generate skill suggestions from learning
// ============================================

async function handlePost(
  request: NextRequest,
  context: { user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const orgId = await resolveOrgId(user);

  const body = await validateBody(request, generateSuggestionsSchema) as GenerateSkillSuggestionRequest;
  const criteria = { ...DEFAULT_SUGGESTION_CRITERIA, ...body.criteria };

  // Get the learning
  const learningRef = db.collection(COLLECTIONS.LEARNINGS).doc(body.learningId);
  const learningDoc = await learningRef.get();

  if (!learningDoc.exists) {
    throw new Error('Learning not found');
  }

  const learning = { id: learningDoc.id, ...learningDoc.data() } as any;

  // Verify org access
  if (learning.orgId !== orgId) {
    throw new Error('Access denied');
  }

  // Check if learning meets criteria
  const meetsCriteria = (
    (learning.impact === criteria.minImpactLevel || 
     (criteria.minImpactLevel === 'low') ||
     (criteria.minImpactLevel === 'medium' && learning.impact !== 'low') ||
     (criteria.minImpactLevel === 'high' && learning.impact === 'high')) &&
    (!criteria.requireActionable || learning.actionable) &&
    (!criteria.excludeCategories || !criteria.excludeCategories.includes(learning.category))
  );

  if (!meetsCriteria) {
    return successResponse<GenerateSkillSuggestionResponse>({
      suggestions: [],
      totalGenerated: 0,
      criteria,
    });
  }

  // Get existing skills to avoid duplication
  const existingSkillsQuery = await db
    .collection(COLLECTIONS.SKILLS)
    .where('orgId', '==', orgId)
    .get();

  const existingSkills = existingSkillsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Check for existing suggestions for this learning
  const existingSuggestionsQuery = await db
    .collection(COLLECTIONS.SKILL_SUGGESTIONS || 'skillSuggestions')
    .where('orgId', '==', orgId)
    .where('learningId', '==', body.learningId)
    .get();

  const existingSuggestions = existingSuggestionsQuery.docs.length;

  if (existingSuggestions >= criteria.maxSuggestionsPerLearning) {
    return successResponse<GenerateSkillSuggestionResponse>({
      suggestions: [],
      totalGenerated: 0,
      criteria,
    });
  }

  // Calculate confidence score
  const confidence = calculateConfidenceScore(learning, existingSkills, criteria);

  if (confidence < criteria.confidenceThreshold) {
    return successResponse<GenerateSkillSuggestionResponse>({
      suggestions: [],
      totalGenerated: 0,
      criteria,
    });
  }

  // Generate skill suggestion
  const skillCategory = mapLearningToSkillCategory(learning.category);
  const priority = determinePriority(learning, confidence);
  const now = new Date().toISOString();

  const suggestion: Omit<SkillSuggestion, 'id'> = {
    orgId,
    learningId: body.learningId,
    learningTitle: learning.title,
    learningDescription: learning.description,
    learningTags: learning.tags || [],
    learningImpact: learning.impact,
    
    suggestedSkillName: `${learning.title}`,
    suggestedSkillDescription: `Skill generated from ${learning.impact}-impact learning: ${learning.title}`,
    suggestedSkillCategory: skillCategory as any,
    suggestedSkillContent: generateSkillContent(learning, skillCategory),
    suggestedTags: [...(learning.tags || []), 'auto-generated', learning.category],
    
    priority,
    confidence,
    status: 'pending',
    
    generatedBy: 'ai',
    generationReason: `High ${learning.impact} impact learning with ${Math.round(confidence * 100)}% confidence score`,
    
    createdAt: now,
    updatedAt: now,
  };

  // Save suggestion to Firestore
  const suggestionRef = await db
    .collection(COLLECTIONS.SKILL_SUGGESTIONS || 'skillSuggestions')
    .add(suggestion);

  const savedSuggestion: SkillSuggestion = {
    id: suggestionRef.id,
    ...suggestion,
  };

  return successResponse<GenerateSkillSuggestionResponse>({
    suggestions: [savedSuggestion],
    totalGenerated: 1,
    criteria,
  });
}

// ============================================
// GET - List skill suggestions
// ============================================

async function handleGet(
  request: NextRequest,
  context: { user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const orgId = await resolveOrgId(user);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const limit = parseInt(searchParams.get('limit') || '20');

  let query = db
    .collection(COLLECTIONS.SKILL_SUGGESTIONS || 'skillSuggestions')
    .where('orgId', '==', orgId);

  if (status) {
    query = query.where('status', '==', status);
  }

  if (priority) {
    query = query.where('priority', '==', priority);
  }

  query = query
    .orderBy('createdAt', 'desc')
    .limit(limit);

  const snapshot = await query.get();

  const suggestions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SkillSuggestion[];

  return successResponse({
    suggestions,
    total: suggestions.length,
    filters: { status, priority, limit },
  });
}

// ============================================
// Route Handlers
// ============================================

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);