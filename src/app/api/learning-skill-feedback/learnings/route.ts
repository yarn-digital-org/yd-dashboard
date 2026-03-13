// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
    const type = searchParams.get('type');
    const domain = searchParams.get('domain');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = db.collection('learning_events').orderBy('timestamp', 'desc');

    if (type && type !== 'all') {
      query = query.where('type', '==', type);
    }

    if (domain && domain !== 'all') {
      query = query.where('patterns.domain', '==', domain);
    }

    const snapshot = await query.limit(limit).get();
    const learnings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(learnings);
  } catch (error) {
    console.error('Error fetching learnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learnings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const learning = {
      ...body,
      id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate required fields
    if (!learning.action || !learning.type || !learning.context) {
      return NextResponse.json(
        { error: 'Missing required fields: action, type, context' },
        { status: 400 }
      );
    }

    // Add to Firestore
    await db.collection('learning_events').doc(learning.id).set(learning);

    // Generate skill recommendations based on the new learning
    await generateSkillRecommendations(learning);

    return NextResponse.json(learning, { status: 201 });
  } catch (error) {
    console.error('Error creating learning:', error);
    return NextResponse.json(
      { error: 'Failed to create learning' },
      { status: 500 }
    );
  }
}

async function generateSkillRecommendations(learning: any) {
  try {
    // Basic skill recommendation logic based on learning patterns
    const skillMappings = {
      'error_resolution': ['debugging', 'troubleshooting', 'problem_solving'],
      'workflow_optimization': ['process_design', 'automation', 'efficiency'],
      'knowledge_gap': ['research', 'learning_methodology', 'knowledge_management'],
      'tool_usage': ['tool_mastery', 'technical_skills', 'productivity'],
      'task_completion': ['project_management', 'execution', 'delivery']
    };

    const relevantSkills = skillMappings[learning.type] || [];
    
    for (const skill of relevantSkills) {
      const existingRecommendation = await db
        .collection('skill_recommendations')
        .where('skill', '==', skill)
        .where('status', '!=', 'completed')
        .limit(1)
        .get();

      if (existingRecommendation.empty) {
        const recommendation = {
          id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          skill: skill,
          domain: learning.patterns.domain || 'general',
          priority: calculatePriority(learning),
          learning_path: generateLearningPath(skill),
          estimated_time: calculateEstimatedTime(skill),
          success_metrics: generateSuccessMetrics(skill),
          progress: 0,
          status: 'not_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_learning_id: learning.id
        };

        await db.collection('skill_recommendations').doc(recommendation.id).set(recommendation);
      }
    }
  } catch (error) {
    console.error('Error generating skill recommendations:', error);
  }
}

function calculatePriority(learning: any): 'high' | 'medium' | 'low' {
  if (learning.confidence < 50) return 'high';
  if (learning.confidence < 75) return 'medium';
  return 'low';
}

function generateLearningPath(skill: string) {
  const commonPaths = {
    debugging: [
      { step: 1, title: 'Error Identification Techniques', duration: '2h' },
      { step: 2, title: 'Systematic Troubleshooting', duration: '3h' },
      { step: 3, title: 'Advanced Debugging Tools', duration: '4h' },
      { step: 4, title: 'Prevention Strategies', duration: '2h' }
    ],
    automation: [
      { step: 1, title: 'Process Analysis', duration: '2h' },
      { step: 2, title: 'Tool Selection', duration: '1h' },
      { step: 3, title: 'Implementation Planning', duration: '3h' },
      { step: 4, title: 'Testing & Optimization', duration: '3h' }
    ]
  };

  return commonPaths[skill] || [
    { step: 1, title: 'Foundation Concepts', duration: '2h' },
    { step: 2, title: 'Practical Application', duration: '3h' },
    { step: 3, title: 'Advanced Techniques', duration: '3h' }
  ];
}

function calculateEstimatedTime(skill: string): number {
  const timeMappings = {
    debugging: 11,
    automation: 9,
    research: 8,
    troubleshooting: 10,
    process_design: 12
  };

  return timeMappings[skill] || 8;
}

function generateSuccessMetrics(skill: string): string[] {
  const metricMappings = {
    debugging: ['Reduce error resolution time by 50%', 'Identify root cause within 30 minutes'],
    automation: ['Automate 3 manual processes', 'Save 5+ hours per week'],
    research: ['Complete research 25% faster', 'Improve information quality score']
  };

  return metricMappings[skill] || ['Demonstrate proficiency in skill application', 'Complete practical exercises'];
}
