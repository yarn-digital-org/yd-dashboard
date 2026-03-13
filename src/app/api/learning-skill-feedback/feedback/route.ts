import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Get learning events and skill recommendations data
    const [learningsSnapshot, recommendationsSnapshot] = await Promise.all([
      db.collection('learning_events')
        .where('timestamp', '>=', startDate.toISOString())
        .where('timestamp', '<=', endDate.toISOString())
        .get(),
      db.collection('skill_recommendations').get()
    ]);

    const learnings = learningsSnapshot.docs.map(doc => doc.data());
    const recommendations = recommendationsSnapshot.docs.map(doc => doc.data());

    // Calculate feedback analysis
    const analysis = await analyzeFeedback(learnings, recommendations, parseInt(timeframe));

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error generating feedback analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback analysis' },
      { status: 500 }
    );
  }
}

async function analyzeFeedback(learnings: any[], recommendations: any[], timeframeDays: number) {
  // Calculate effectiveness metrics
  const effectiveness = calculateEffectiveness(learnings, recommendations, timeframeDays);
  
  // Identify areas for improvement
  const areas_for_improvement = identifyImprovementAreas(learnings, recommendations);
  
  // Extract success patterns
  const success_patterns = extractSuccessPatterns(learnings, recommendations);
  
  // Find optimization opportunities
  const optimization_opportunities = findOptimizationOpportunities(learnings, recommendations);

  return {
    effectiveness,
    areas_for_improvement,
    success_patterns,
    optimization_opportunities,
    generated_at: new Date().toISOString(),
    timeframe_days: timeframeDays
  };
}

function calculateEffectiveness(learnings: any[], recommendations: any[], timeframeDays: number) {
  // Base metrics calculation
  const totalLearnings = learnings.length;
  const averageConfidence = totalLearnings > 0 
    ? learnings.reduce((sum, l) => sum + (l.confidence || 0), 0) / totalLearnings 
    : 0;

  const completedRecommendations = recommendations.filter(r => r.status === 'completed').length;
  const totalRecommendations = recommendations.length;
  
  const skill_acquisition_rate = totalRecommendations > 0 
    ? Math.round((completedRecommendations / totalRecommendations) * 100) 
    : 0;

  // Calculate performance improvement based on learning patterns
  const errorResolutionLearnings = learnings.filter(l => l.type === 'error_resolution');
  const workflowOptimizations = learnings.filter(l => l.type === 'workflow_optimization');
  
  const performance_improvement = Math.min(100, Math.round(
    (errorResolutionLearnings.length * 15) + 
    (workflowOptimizations.length * 20) + 
    (averageConfidence * 0.5)
  ));

  // Calculate knowledge retention based on recurring patterns
  const domainCounts = {};
  learnings.forEach(l => {
    const domain = l.patterns?.domain || 'unknown';
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });
  
  const knowledge_retention = Math.min(100, Math.round(
    Object.values(domainCounts).reduce((sum: number, count) => sum + Math.min(count * 10, 30), 0) / 
    Math.max(Object.keys(domainCounts).length, 1)
  ));

  // Application success based on task completion rate
  const taskCompletions = learnings.filter(l => l.type === 'task_completion');
  const application_success = Math.min(100, Math.round(
    (taskCompletions.length / Math.max(totalLearnings, 1)) * 100
  ));

  // Calculate overall score
  const individual_metrics = {
    skill_acquisition_rate,
    performance_improvement,
    knowledge_retention,
    application_success
  };

  const overall_score = Math.round(
    Object.values(individual_metrics).reduce((sum, value) => sum + value, 0) / 4
  );

  // Calculate trends (simplified - would need historical data for real trends)
  const trends = {
    direction: overall_score >= 70 ? 'up' as const : overall_score >= 50 ? 'stable' as const : 'down' as const,
    percentage: Math.abs(overall_score - 65) // Base comparison point
  };

  return {
    overall_score,
    individual_metrics,
    trends
  };
}

function identifyImprovementAreas(learnings: any[], recommendations: any[]): string[] {
  const areas = [];

  // Check for low confidence learnings
  const lowConfidenceLearnings = learnings.filter(l => (l.confidence || 0) < 50);
  if (lowConfidenceLearnings.length > learnings.length * 0.3) {
    areas.push('High number of low-confidence learning events - review learning capture methodology');
  }

  // Check for stalled recommendations
  const stalledRecommendations = recommendations.filter(r => 
    r.status === 'in_progress' && r.progress < 50
  );
  if (stalledRecommendations.length > 0) {
    areas.push(`${stalledRecommendations.length} skill recommendations show limited progress - review learning paths`);
  }

  // Check for domain imbalances
  const domainCounts = {};
  learnings.forEach(l => {
    const domain = l.patterns?.domain || 'unknown';
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });

  const domains = Object.keys(domainCounts);
  if (domains.length > 1) {
    const maxCount = Math.max(...Object.values(domainCounts));
    const minCount = Math.min(...Object.values(domainCounts));
    if (maxCount > minCount * 3) {
      areas.push('Uneven learning distribution across domains - consider balancing focus areas');
    }
  }

  // Check for repeated failures
  const failurePatterns = {};
  learnings.forEach(l => {
    if (l.outcome?.failure_points) {
      l.outcome.failure_points.forEach(failure => {
        failurePatterns[failure] = (failurePatterns[failure] || 0) + 1;
      });
    }
  });

  const repeatedFailures = Object.entries(failurePatterns)
    .filter(([_, count]) => count > 2)
    .map(([failure, _]) => failure);

  if (repeatedFailures.length > 0) {
    areas.push('Repeated failure patterns detected - implement targeted remediation strategies');
  }

  return areas.length > 0 ? areas : ['No significant improvement areas identified'];
}

function extractSuccessPatterns(learnings: any[], recommendations: any[]): string[] {
  const patterns = [];

  // High confidence patterns
  const highConfidenceLearnings = learnings.filter(l => (l.confidence || 0) >= 80);
  if (highConfidenceLearnings.length > 0) {
    const domains = [...new Set(highConfidenceLearnings.map(l => l.patterns?.domain))].filter(Boolean);
    patterns.push(`High-confidence learning achieved in: ${domains.join(', ')}`);
  }

  // Successful completion patterns
  const completedRecommendations = recommendations.filter(r => r.status === 'completed');
  if (completedRecommendations.length > 0) {
    const avgTime = completedRecommendations.reduce((sum, r) => sum + (r.estimated_time || 0), 0) / completedRecommendations.length;
    patterns.push(`Successfully completed ${completedRecommendations.length} skill recommendations with avg ${avgTime.toFixed(1)}h investment`);
  }

  // Tool usage effectiveness
  const toolUsageLearnings = learnings.filter(l => l.type === 'tool_usage');
  if (toolUsageLearnings.length > 0) {
    const tools = [...new Set(toolUsageLearnings.flatMap(l => l.patterns?.tools_used || []))].filter(Boolean);
    patterns.push(`Effective tool utilization: ${tools.slice(0, 3).join(', ')}${tools.length > 3 ? '...' : ''}`);
  }

  // Workflow optimization success
  const optimizations = learnings.filter(l => l.type === 'workflow_optimization');
  if (optimizations.length >= 2) {
    patterns.push('Consistent workflow optimization demonstrates systematic improvement approach');
  }

  return patterns.length > 0 ? patterns : ['Establishing baseline patterns - more data needed for pattern analysis'];
}

function findOptimizationOpportunities(learnings: any[], recommendations: any[]) {
  const opportunities = [];

  // Recommendation completion optimization
  const inProgressRecs = recommendations.filter(r => r.status === 'in_progress');
  const highProgressRecs = inProgressRecs.filter(r => r.progress >= 75);
  
  if (highProgressRecs.length > 0) {
    opportunities.push({
      description: `${highProgressRecs.length} skill recommendations are nearly complete`,
      recommended_action: 'Focus on completing high-progress recommendations to achieve quick wins',
      expected_impact: 'high',
      estimated_effort: 'low'
    });
  }

  // Learning capture optimization
  const recentLearnings = learnings.filter(l => {
    const learningDate = new Date(l.timestamp);
    const daysBetween = (Date.now() - learningDate.getTime()) / (1000 * 3600 * 24);
    return daysBetween <= 7;
  });

  if (recentLearnings.length < 5) {
    opportunities.push({
      description: 'Low recent learning capture rate detected',
      recommended_action: 'Implement automated learning capture for routine tasks',
      expected_impact: 'medium',
      estimated_effort: 'medium'
    });
  }

  // Domain focus optimization
  const domainCounts = {};
  learnings.forEach(l => {
    const domain = l.patterns?.domain || 'unknown';
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });

  const primaryDomain = Object.entries(domainCounts).sort(([,a], [,b]) => b - a)[0];
  if (primaryDomain && primaryDomain[1] > learnings.length * 0.5) {
    opportunities.push({
      description: `Strong focus on ${primaryDomain[0]} domain presents specialization opportunity`,
      recommended_action: 'Develop advanced skill tracks in primary domain area',
      expected_impact: 'high',
      estimated_effort: 'medium'
    });
  }

  // Confidence improvement opportunity
  const avgConfidence = learnings.reduce((sum, l) => sum + (l.confidence || 0), 0) / learnings.length;
  if (avgConfidence < 70) {
    opportunities.push({
      description: 'Below-target confidence levels in learning capture',
      recommended_action: 'Implement confidence calibration and validation mechanisms',
      expected_impact: 'medium',
      estimated_effort: 'high'
    });
  }

  return opportunities.length > 0 ? opportunities : [{
    description: 'System performing within expected parameters',
    recommended_action: 'Continue current approach and monitor for emerging patterns',
    expected_impact: 'medium',
    estimated_effort: 'low'
  }];
}
