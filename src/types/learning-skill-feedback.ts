/**
 * Learning-to-Skill Feedback Loop Types
 * 
 * This module defines the interfaces for the feedback loop between 
 * learnings and skills, enabling automatic skill suggestions and
 * learning-driven skill creation.
 */

import { Learning, Skill, LearningCategory, SkillCategory, Timestamp } from './database';

// ============================================
// Learning-to-Skill Suggestion System
// ============================================

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'implemented';
export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface SkillSuggestion {
  id: string;
  orgId: string;
  
  // Source learning that triggered the suggestion
  learningId: string;
  learningTitle: string;
  learningDescription: string;
  learningTags: string[];
  learningImpact: string; // high/medium/low
  
  // Suggested skill details
  suggestedSkillName: string;
  suggestedSkillDescription: string;
  suggestedSkillCategory: SkillCategory;
  suggestedSkillContent: string; // markdown content
  suggestedTags: string[];
  
  // Suggestion metadata
  priority: SuggestionPriority;
  confidence: number; // 0-1 confidence score
  status: SuggestionStatus;
  
  // Auto-generation metadata
  generatedBy: 'ai' | 'manual';
  generationReason: string;
  
  // Review and implementation
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  implementedAt?: Timestamp;
  resultingSkillId?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Learning-Skill Relationship Tracking
// ============================================

export interface LearningSkillRelationship {
  id: string;
  orgId: string;
  learningId: string;
  skillId: string;
  relationshipType: 'generated_from' | 'informed_by' | 'validates';
  createdAt: Timestamp;
}

// ============================================
// Feedback Loop Analytics
// ============================================

export interface FeedbackLoopMetrics {
  id: string;
  orgId: string;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  
  // Learning metrics
  totalLearnings: number;
  actionableLearnings: number;
  highImpactLearnings: number;
  
  // Suggestion metrics
  suggestionsGenerated: number;
  suggestionsApproved: number;
  suggestionsRejected: number;
  suggestionsImplemented: number;
  
  // Conversion metrics
  learningsToSkillsRatio: number;
  averageImplementationTime: number; // in days
  
  // Quality metrics
  averageConfidenceScore: number;
  skillUtilizationRate: number;
  
  createdAt: Timestamp;
}

// ============================================
// Category Mapping Configuration
// ============================================

export interface CategoryMapping {
  learningCategory: LearningCategory;
  preferredSkillCategories: SkillCategory[];
  mappingWeight: number; // 0-1, how strongly this maps
}

export const DEFAULT_CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    learningCategory: 'seo',
    preferredSkillCategories: ['SEO', 'Content', 'Analytics'],
    mappingWeight: 0.9
  },
  {
    learningCategory: 'development',
    preferredSkillCategories: ['Development', 'Operations'],
    mappingWeight: 0.95
  },
  {
    learningCategory: 'design',
    preferredSkillCategories: ['Design', 'Content'],
    mappingWeight: 0.9
  },
  {
    learningCategory: 'marketing',
    preferredSkillCategories: ['Marketing', 'Content', 'Analytics'],
    mappingWeight: 0.85
  },
  {
    learningCategory: 'client-management',
    preferredSkillCategories: ['Operations', 'Content'],
    mappingWeight: 0.7
  }
];

// ============================================
// Suggestion Generation Configuration
// ============================================

export interface SuggestionCriteria {
  minImpactLevel: 'high' | 'medium' | 'low';
  requireActionable: boolean;
  minTagOverlap: number; // minimum number of overlapping tags
  excludeCategories?: LearningCategory[];
  maxSuggestionsPerLearning: number;
  confidenceThreshold: number; // 0-1
}

export const DEFAULT_SUGGESTION_CRITERIA: SuggestionCriteria = {
  minImpactLevel: 'medium',
  requireActionable: true,
  minTagOverlap: 2,
  maxSuggestionsPerLearning: 3,
  confidenceThreshold: 0.6
};

// ============================================
// API Request/Response Types
// ============================================

export interface GenerateSkillSuggestionRequest {
  learningId: string;
  criteria?: Partial<SuggestionCriteria>;
}

export interface GenerateSkillSuggestionResponse {
  suggestions: SkillSuggestion[];
  totalGenerated: number;
  criteria: SuggestionCriteria;
}

export interface ImplementSkillSuggestionRequest {
  suggestionId: string;
  customizations?: {
    name?: string;
    description?: string;
    category?: SkillCategory;
    content?: string;
    tags?: string[];
  };
}

export interface ImplementSkillSuggestionResponse {
  skillId: string;
  suggestionId: string;
  relationshipId: string;
  skill: Skill;
}

export interface FeedbackLoopStatsResponse {
  metrics: FeedbackLoopMetrics;
  recentSuggestions: SkillSuggestion[];
  topPerformingCategories: Array<{
    category: LearningCategory;
    conversionRate: number;
    averageConfidence: number;
  }>;
  recommendations: string[];
}