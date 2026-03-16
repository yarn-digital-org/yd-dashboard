import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Lazy initialization — avoid running at build time when env vars aren't available
function getDb(): Firestore {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Generate daily summary data
    const summaryData = await generateDailySummary(date);

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily summary' },
      { status: 500 }
    );
  }
}

async function generateDailySummary(date: string) {
  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Collect data from various sources
  const [analyticsData, campaignData, taskData, systemData] = await Promise.all([
    getAnalyticsData(startOfDay, endOfDay),
    getCampaignData(startOfDay, endOfDay),
    getTaskData(startOfDay, endOfDay),
    getSystemData(startOfDay, endOfDay)
  ]);

  // Generate insights and anomalies
  const insights = generateInsights(analyticsData, campaignData, taskData);
  const anomalies = detectAnomalies(analyticsData, campaignData, taskData, systemData);
  const actions = generateActionItems(anomalies, taskData);

  return {
    date,
    metrics: {
      analytics: analyticsData,
      campaigns: campaignData,
      tasks: taskData,
      system: systemData
    },
    insights,
    anomalies,
    actions
  };
}

async function getAnalyticsData(startDate: Date, endDate: Date) {
  try {
    // In production, this would integrate with GA4 API
    // For now, return simulated data with realistic patterns
    const baseSessionsData = await getBaselineMetrics('analytics_sessions', startDate) as { sessions: number; pageviews: number };
    
    return {
      sessions: Math.round(baseSessionsData.sessions * (0.8 + Math.random() * 0.4)),
      pageviews: Math.round(baseSessionsData.pageviews * (0.8 + Math.random() * 0.4)),
      bounce_rate: 0.3 + Math.random() * 0.4,
      avg_session_duration: 120 + Math.random() * 180,
      trend: determineTrend(baseSessionsData.sessions, baseSessionsData.sessions * (0.8 + Math.random() * 0.4))
    };
  } catch (error) {
    // Return default values if data collection fails
    return {
      sessions: 1250,
      pageviews: 3400,
      bounce_rate: 0.42,
      avg_session_duration: 180,
      trend: 'stable' as const
    };
  }
}

async function getCampaignData(startDate: Date, endDate: Date) {
  try {
    // In production, integrate with Meta Ads API and Google Ads API
    const baseCampaignData = await getBaselineMetrics('campaign_performance', startDate) as { impressions: number; spend: number };
    
    const impressions = Math.round(baseCampaignData.impressions * (0.7 + Math.random() * 0.6));
    const clicks = Math.round(impressions * (0.02 + Math.random() * 0.06)); // 2-8% CTR
    const conversions = Math.round(clicks * (0.05 + Math.random() * 0.15)); // 5-20% conversion rate
    const spend = baseCampaignData.spend * (0.8 + Math.random() * 0.4);
    
    return {
      impressions,
      clicks,
      conversions,
      spend,
      cpc: spend / clicks,
      ctr: clicks / impressions
    };
  } catch (error) {
    return {
      impressions: 45000,
      clicks: 1800,
      conversions: 140,
      spend: 450,
      cpc: 0.25,
      ctr: 0.04
    };
  }
}

async function getTaskData(startDate: Date, endDate: Date) {
  try {
    // Query actual task completion data from project management system
    const tasksSnapshot = await getDb().collection('tasks')
      .where('date', '>=', startDate.toISOString())
      .where('date', '<=', endDate.toISOString())
      .get();

    const tasks = tasksSnapshot.docs.map(doc => doc.data());
    const completed = tasks.filter(task => task.status === 'completed').length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const overdue = tasks.filter(task => {
      const deadline = new Date(task.deadline);
      return deadline < new Date() && task.status !== 'completed';
    }).length;

    return {
      completed,
      in_progress: inProgress,
      overdue,
      completion_rate: tasks.length > 0 ? completed / tasks.length : 0
    };
  } catch (error) {
    return {
      completed: 18,
      in_progress: 7,
      overdue: 2,
      completion_rate: 0.67
    };
  }
}

async function getSystemData(startDate: Date, endDate: Date) {
  try {
    // Query system health metrics
    const systemSnapshot = await getDb().collection('system_metrics')
      .where('timestamp', '>=', startDate.toISOString())
      .where('timestamp', '<=', endDate.toISOString())
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!systemSnapshot.empty) {
      const data = systemSnapshot.docs[0].data();
      return {
        uptime: data.uptime || 0.995,
        errors: data.errors || 3,
        response_time: data.response_time || 150,
        api_calls: data.api_calls || 2400
      };
    }
  } catch (error) {
    console.error('Error fetching system data:', error);
  }

  return {
    uptime: 0.995,
    errors: 3,
    response_time: 150,
    api_calls: 2400
  };
}

async function getBaselineMetrics(type: string, date: Date): Promise<Record<string, number>> {
  try {
    const snapshot = await getDb().collection('baseline_metrics')
      .where('type', '==', type)
      .where('date', '<=', date.toISOString())
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Record<string, number>;
    }
  } catch (error) {
    console.error('Error fetching baseline metrics:', error);
  }

  // Default baselines
  const defaults: Record<string, Record<string, number>> = {
    analytics_sessions: {
      sessions: 1200,
      pageviews: 3200
    },
    campaign_performance: {
      impressions: 40000,
      spend: 400
    }
  };

  return defaults[type] || {};
}

function determineTrend(baseline: number, current: number): 'up' | 'down' | 'stable' {
  const change = (current - baseline) / baseline;
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'stable';
}

function generateInsights(analyticsData: any, campaignData: any, taskData: any): string[] {
  const insights = [];

  // Analytics insights
  if (analyticsData.trend === 'up') {
    insights.push(`Website traffic increased by ${Math.round((analyticsData.sessions / 1200 - 1) * 100)}% compared to baseline`);
  }

  if (analyticsData.bounce_rate < 0.35) {
    insights.push('Excellent user engagement - bounce rate below 35%');
  }

  // Campaign insights
  if (campaignData.ctr > 0.05) {
    insights.push(`Strong campaign performance with ${(campaignData.ctr * 100).toFixed(1)}% click-through rate`);
  }

  if (campaignData.cpc < 0.20) {
    insights.push(`Cost-effective advertising with £${campaignData.cpc.toFixed(2)} cost per click`);
  }

  // Task insights
  if (taskData.completion_rate > 0.8) {
    insights.push(`High productivity with ${Math.round(taskData.completion_rate * 100)}% task completion rate`);
  }

  if (insights.length === 0) {
    insights.push('All systems performing within normal parameters');
  }

  return insights;
}

function detectAnomalies(analyticsData: any, campaignData: any, taskData: any, systemData: any) {
  const anomalies = [];

  // Check for significant deviations
  if (analyticsData.bounce_rate > 0.6) {
    anomalies.push({
      metric: 'Bounce Rate',
      current: Math.round(analyticsData.bounce_rate * 100),
      expected: 45,
      severity: 'high' as const,
      description: 'Bounce rate significantly higher than normal'
    });
  }

  if (campaignData.cpc > 0.4) {
    anomalies.push({
      metric: 'Cost Per Click',
      current: parseFloat(campaignData.cpc.toFixed(2)),
      expected: 0.25,
      severity: 'medium' as const,
      description: 'Campaign costs above target range'
    });
  }

  if (taskData.overdue > 5) {
    anomalies.push({
      metric: 'Overdue Tasks',
      current: taskData.overdue,
      expected: 2,
      severity: 'high' as const,
      description: 'Multiple tasks past deadline'
    });
  }

  if (systemData.uptime < 0.98) {
    anomalies.push({
      metric: 'System Uptime',
      current: Math.round(systemData.uptime * 100),
      expected: 99,
      severity: 'high' as const,
      description: 'System availability below SLA requirements'
    });
  }

  return anomalies;
}

function generateActionItems(anomalies: any[], taskData: any) {
  const actions = [];

  // Generate actions based on anomalies
  anomalies.forEach(anomaly => {
    if (anomaly.metric === 'Bounce Rate') {
      actions.push({
        priority: 'high' as const,
        task: 'Review landing page performance and user experience',
        assigned_to: 'UX Team',
        deadline: getDeadline(3) // 3 days
      });
    }

    if (anomaly.metric === 'Cost Per Click') {
      actions.push({
        priority: 'medium' as const,
        task: 'Optimize campaign targeting and bid strategies',
        assigned_to: 'Blaze (Ads)',
        deadline: getDeadline(2)
      });
    }

    if (anomaly.metric === 'Overdue Tasks') {
      actions.push({
        priority: 'high' as const,
        task: 'Review project deadlines and resource allocation',
        assigned_to: 'Project Manager',
        deadline: getDeadline(1)
      });
    }
  });

  // Standard maintenance actions
  if (taskData.completion_rate < 0.7) {
    actions.push({
      priority: 'medium' as const,
      task: 'Analyze workflow bottlenecks and process improvements',
      assigned_to: 'Operations',
      deadline: getDeadline(7)
    });
  }

  return actions;
}

function getDeadline(daysFromNow: number): string {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + daysFromNow);
  return deadline.toISOString().split('T')[0];
}
