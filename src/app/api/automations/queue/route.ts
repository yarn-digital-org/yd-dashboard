import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { fireAutomations, TriggerType } from '@/lib/automation-engine';
import { verifyAuth } from '@/lib/api-middleware';

/**
 * Automation Queue
 *
 * POST /api/automations/queue — enqueue a trigger event
 *   Body: { triggerType, triggerData }
 *   Returns immediately after queuing (non-blocking)
 *
 * GET  /api/automations/queue — process queue items (called by cron or manually)
 *   Reads pending items from automation_queue collection and fires them
 *
 * For most triggers, fireAutomations() is called inline (fast path).
 * Queue is for large fan-out scenarios or retries.
 */

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const { triggerType, triggerData } = await request.json();

    if (!triggerType) {
      return NextResponse.json({ error: 'triggerType required' }, { status: 400 });
    }

    // For manual/API-initiated triggers, fire immediately (non-blocking via background)
    const queueRef = await adminDb.collection('automation_queue').add({
      triggerType,
      triggerData: triggerData || {},
      userId: user.userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retries: 0,
    });

    // Fire immediately in background (don't await — return fast)
    fireAutomations(triggerType as TriggerType, triggerData || {}, user.userId)
      .then(async (logs) => {
        await adminDb!.collection('automation_queue').doc(queueRef.id).update({
          status: 'completed',
          processedAt: new Date().toISOString(),
          logsCount: logs.length,
        });
      })
      .catch(async (err) => {
        await adminDb!.collection('automation_queue').doc(queueRef.id).update({
          status: 'failed',
          error: err.message,
          failedAt: new Date().toISOString(),
        }).catch(() => {});
      });

    return NextResponse.json({
      success: true,
      queueId: queueRef.id,
      message: 'Trigger queued and firing in background',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

// GET — list recent queue items (for monitoring)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const snap = await adminDb
      .collection('automation_queue')
      .where('userId', '==', user.userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ data: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
