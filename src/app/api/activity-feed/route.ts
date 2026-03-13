// Real-Time Activity Feed API
// Streams live agent activity: task updates, completions, blockers

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function requireDb() {
  if (!adminDb) throw new Error('Firebase not initialized');
  return adminDb;
}
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  eventType: 'task_started' | 'task_completed' | 'task_blocked' | 'task_updated' | 'comment' | 'status_change';
  taskId?: string;
  taskTitle?: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

const AGENT_COLOURS: Record<string, string> = {
  Radar: '#3B82F6',
  Scout: '#10B981',
  Aria:  '#8B5CF6',
  Bolt:  '#F59E0B',
  Jarvis:'#6B7280',
  Blaze: '#EF4444',
};

// POST — log a new activity event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, agentName, eventType, taskId, taskTitle, message, metadata, severity } = body;

    if (!agentId || !agentName || !eventType || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: agentId, agentName, eventType, message' },
        { status: 400 }
      );
    }

    const event: Omit<ActivityEvent, 'id'> = {
      agentId,
      agentName,
      eventType,
      taskId: taskId ?? null,
      taskTitle: taskTitle ?? null,
      message,
      metadata: metadata ?? {},
      timestamp: new Date().toISOString(),
      severity: severity ?? 'info',
    };

    const docRef = await requireDb().collection('activity_feed').add({
      ...event,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Activity feed POST error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET — fetch recent activity (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId  = searchParams.get('agentId');
    const since    = searchParams.get('since');   // ISO timestamp
    const limitN   = parseInt(searchParams.get('limit') ?? '50', 10);
    const severity = searchParams.get('severity');

    let q = requireDb()
      .collection('activity_feed')
      .orderBy('createdAt', 'desc')
      .limit(Math.min(limitN, 200));

    if (agentId) q = q.where('agentId', '==', agentId);
    if (severity) q = q.where('severity', '==', severity);
    if (since) {
      const sinceTs = Timestamp.fromDate(new Date(since));
      q = q.where('createdAt', '>', sinceTs);
    }

    const snapshot = await q.get();
    const events: ActivityEvent[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<ActivityEvent, 'id'>),
    }));

    return NextResponse.json({
      success: true,
      events,
      agentColours: AGENT_COLOURS,
      count: events.length,
    });
  } catch (error) {
    console.error('Activity feed GET error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
