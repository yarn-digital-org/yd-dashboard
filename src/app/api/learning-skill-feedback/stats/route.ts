import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  withAuth,
  successResponse,
  requireDb,
  AuthUser,
  resolveOrgId,
} from '@/lib/api-middleware';
import { COLLECTIONS } from '@/types';
import type {
  FeedbackLoopStatsResponse,
  FeedbackLoopMetrics,
  SkillSuggestion,
} from '@/types/learning-skill-feedback';

// ============================================
// GET - Feedback loop analytics and stats
// ============================================

async function handleGet(
  request: NextRequest,
  context: { user: AuthUser }
) {
  const db = requireDb();
  const { user } = context;
  const orgId = await resolveOrgId(user);

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30'; // days
  const periodDays = parseInt(period);
  
  const now = new Date();
  const periodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
  
  // Get learnings in period
  const learningsQuery = await db
    .collection(COLLECTIONS.LEARNINGS)
    .where('orgId', '==', orgId)
    .where('dateCreated', '>=', periodStart.toISOString())
    .get();

  const learnings = learningsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];

  // Get skill suggestions in period
  const suggestionsQuery = await db
    .collection(COLLECTIONS.SKILL_SUGGESTIONS)
    .where('orgId', '==', orgId)
    .where('createdAt', '>=', periodStart.toISOString())
    .get();

  const suggestions = suggestionsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SkillSuggestion[];

  // Get skills created in period
  const skillsQuery = await db
    .collection(COLLECTIONS.SKILLS)
    .where('orgId', '==', orgId)
    .where('createdAt', '>=', periodStart.toISOString())
    .get();

  const skills = skillsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Calculate metrics
  const totalLearnings = learnings.length;
  const actionableLearnings = learnings.filter(l => l.actionable).length;
  const highImpactLearnings = learnings.filter(l => l.impact === 'high').length;

  const suggestionsGenerated = suggestions.length;
  const suggestionsApproved = suggestions.filter(s => s.status === 'approved').length;
  const suggestionsRejected = suggestions.filter(s => s.status === 'rejected').length;
  const suggestionsImplemented = suggestions.filter(s => s.status === 'implemented').length;

  const learningsToSkillsRatio = totalLearnings > 0 ? suggestionsImplemented / totalLearnings : 0;

  // Calculate average implementation time
  const implementedSuggestions = suggestions.filter(s => s.status === 'implemented' && s.implementedAt);
  const avgImplementationTime = implementedSuggestions.length > 0 
    ? implementedSuggestions.reduce((sum, s) => {
        const created = new Date(s.createdAt);
        const implemented = new Date(s.implementedAt!);
        return sum + (implemented.getTime() - created.getTime());
      }, 0) / implementedSuggestions.length / (24 * 60 * 60 * 1000) // convert to days
    : 0;

  // Calculate average confidence score
  const avgConfidenceScore = suggestions.length > 0
    ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
    : 0;

  // Calculate skill utilization rate (simplified - could be enhanced)
  const skillUtilizationRate = skills.length > 0 ? 0.75 : 0; // Placeholder - would need actual usage tracking

  // Create metrics object
  const metrics: FeedbackLoopMetrics = {
    id: `metrics-${orgId}-${now.toISOString().split('T')[0]}`,
    orgId,
    periodStart: periodStart.toISOString(),
    periodEnd: now.toISOString(),
    
    totalLearnings,
    actionableLearnings,
    highImpactLearnings,
    
    suggestionsGenerated,
    suggestionsApproved,
    suggestionsRejected,
    suggestionsImplemented,
    
    learningsToSkillsRatio,
    averageImplementationTime: avgImplementationTime,
    
    averageConfidenceScore: avgConfidenceScore,
    skillUtilizationRate,
    
    createdAt: now.toISOString(),
  };

  // Get recent suggestions (last 10)
  const recentSuggestionsQuery = await db
    .collection(COLLECTIONS.SKILL_SUGGESTIONS)
    .where('orgId', '==', orgId)
    .orderBy('createdAt', 'desc')
    .limit(10);

  const recentSuggestionsSnapshot = await recentSuggestionsQuery.get();
  const recentSuggestions = recentSuggestionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SkillSuggestion[];

  // Calculate top performing categories
  const categoryStats = new Map();
  
  suggestions.forEach(s => {
    const category = s.learningDescription.includes('seo') ? 'seo' :
                    s.learningDescription.includes('development') ? 'development' :
                    s.learningDescription.includes('design') ? 'design' :
                    s.learningDescription.includes('marketing') ? 'marketing' : 'client-management';
    
    if (!categoryStats.has(category)) {
      categoryStats.set(category, { total: 0, implemented: 0, confidenceSum: 0 });
    }
    
    const stats = categoryStats.get(category);
    stats.total++;
    stats.confidenceSum += s.confidence;
    if (s.status === 'implemented') stats.implemented++;
  });

  const topPerformingCategories = Array.from(categoryStats.entries()).map(([category, stats]) => ({
    category,
    conversionRate: stats.total > 0 ? stats.implemented / stats.total : 0,
    averageConfidence: stats.total > 0 ? stats.confidenceSum / stats.total : 0,
  })).sort((a, b) => b.conversionRate - a.conversionRate);

  // Generate recommendations
  const recommendations = [];
  
  if (learningsToSkillsRatio < 0.1) {
    recommendations.push('Consider lowering confidence threshold to generate more skill suggestions');
  }
  
  if (avgConfidenceScore < 0.6) {
    recommendations.push('Review suggestion criteria to improve confidence scores');
  }
  
  if (suggestionsRejected > suggestionsApproved) {
    recommendations.push('Analyze rejected suggestions to refine generation algorithm');
  }
  
  if (avgImplementationTime > 7) {
    recommendations.push('Streamline skill implementation process to reduce time to deployment');
  }
  
  if (actionableLearnings < totalLearnings * 0.5) {
    recommendations.push('Encourage marking more learnings as actionable to increase skill generation');
  }

  if (recommendations.length === 0) {
    recommendations.push('Feedback loop is performing well - continue current practices');
  }

  return successResponse<FeedbackLoopStatsResponse>({
    metrics,
    recentSuggestions,
    topPerformingCategories,
    recommendations,
  });
}

// ============================================
// Route Handlers
// ============================================

export const GET = withAuth(handleGet);