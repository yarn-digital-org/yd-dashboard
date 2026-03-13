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
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const domain = searchParams.get('domain');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db.collection('skill_recommendations').orderBy('created_at', 'desc');

    if (priority && priority !== 'all') {
      query = query.where('priority', '==', priority);
    }

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    if (domain && domain !== 'all') {
      query = query.where('domain', '==', domain);
    }

    const snapshot = await query.limit(limit).get();
    const recommendations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const recommendation = {
      ...body,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate required fields
    if (!recommendation.skill || !recommendation.domain || !recommendation.priority) {
      return NextResponse.json(
        { error: 'Missing required fields: skill, domain, priority' },
        { status: 400 }
      );
    }

    // Set defaults
    recommendation.progress = recommendation.progress || 0;
    recommendation.status = recommendation.status || 'not_started';
    recommendation.estimated_time = recommendation.estimated_time || 8;
    recommendation.learning_path = recommendation.learning_path || generateDefaultLearningPath(recommendation.skill);
    recommendation.success_metrics = recommendation.success_metrics || generateDefaultSuccessMetrics(recommendation.skill);

    // Add to Firestore
    await db.collection('skill_recommendations').doc(recommendation.id).set(recommendation);

    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing recommendation ID' },
        { status: 400 }
      );
    }

    // Update timestamp
    updates.updated_at = new Date().toISOString();

    // Update in Firestore
    await db.collection('skill_recommendations').doc(id).update(updates);

    // Get updated document
    const doc = await db.collection('skill_recommendations').doc(id).get();
    const updatedRecommendation = { id: doc.id, ...doc.data() };

    return NextResponse.json(updatedRecommendation);
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing recommendation ID' },
        { status: 400 }
      );
    }

    // Delete from Firestore
    await db.collection('skill_recommendations').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to delete recommendation' },
      { status: 500 }
    );
  }
}

function generateDefaultLearningPath(skill: string) {
  const paths = {
    data_analysis: [
      { step: 1, title: 'Data Collection Fundamentals', duration: '2h', completed: false },
      { step: 2, title: 'Pattern Recognition', duration: '3h', completed: false },
      { step: 3, title: 'Statistical Analysis', duration: '4h', completed: false },
      { step: 4, title: 'Insight Generation', duration: '3h', completed: false }
    ],
    competitive_analysis: [
      { step: 1, title: 'Market Mapping', duration: '2h', completed: false },
      { step: 2, title: 'Competitor Identification', duration: '1h', completed: false },
      { step: 3, title: 'Strategic Analysis', duration: '4h', completed: false },
      { step: 4, title: 'Opportunity Assessment', duration: '2h', completed: false }
    ],
    debugging: [
      { step: 1, title: 'Error Identification', duration: '2h', completed: false },
      { step: 2, title: 'Systematic Investigation', duration: '3h', completed: false },
      { step: 3, title: 'Solution Implementation', duration: '3h', completed: false },
      { step: 4, title: 'Prevention Strategies', duration: '2h', completed: false }
    ],
    automation: [
      { step: 1, title: 'Process Analysis', duration: '2h', completed: false },
      { step: 2, title: 'Tool Selection & Setup', duration: '3h', completed: false },
      { step: 3, title: 'Implementation & Testing', duration: '4h', completed: false },
      { step: 4, title: 'Optimization & Monitoring', duration: '2h', completed: false }
    ]
  };

  return paths[skill] || [
    { step: 1, title: 'Foundation Concepts', duration: '2h', completed: false },
    { step: 2, title: 'Practical Application', duration: '3h', completed: false },
    { step: 3, title: 'Advanced Techniques', duration: '3h', completed: false }
  ];
}

function generateDefaultSuccessMetrics(skill: string): string[] {
  const metrics = {
    data_analysis: [
      'Complete analysis 30% faster',
      'Identify key insights in first review',
      'Generate actionable recommendations',
      'Achieve 90% accuracy in pattern recognition'
    ],
    competitive_analysis: [
      'Map complete competitive landscape',
      'Identify 3+ strategic opportunities',
      'Deliver insights within 24 hours',
      'Provide actionable competitive intelligence'
    ],
    debugging: [
      'Reduce resolution time by 50%',
      'Identify root cause within 30 minutes',
      'Implement lasting solutions',
      'Document learnings for team'
    ],
    automation: [
      'Automate 3+ manual processes',
      'Save 5+ hours per week',
      'Achieve 95% automation reliability',
      'Document processes for handoff'
    ]
  };

  return metrics[skill] || [
    'Demonstrate proficiency in skill application',
    'Complete practical exercises successfully',
    'Apply skill in real-world scenarios',
    'Achieve measurable performance improvement'
  ];
}
