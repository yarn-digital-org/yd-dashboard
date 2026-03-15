import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-middleware';

/**
 * GET /api/automations/runs — list recent automation run logs
 * Query params:
 *   automationId - filter by automation
 *   status       - filter by status (success|failed|partial)
 *   limit        - max results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!adminDb) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const automationId = searchParams.get('automationId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let query: FirebaseFirestore.Query = adminDb
      .collection('automation_runs')
      .where('userId', '==', user.userId)
      .orderBy('executedAt', 'desc')
      .limit(limit);

    if (automationId) {
      query = adminDb
        .collection('automation_runs')
        .where('userId', '==', user.userId)
        .where('automationId', '==', automationId)
        .orderBy('executedAt', 'desc')
        .limit(limit);
    }

    if (status) {
      query = adminDb
        .collection('automation_runs')
        .where('userId', '==', user.userId)
        .where('status', '==', status)
        .orderBy('executedAt', 'desc')
        .limit(limit);
    }

    const snap = await query.get();
    const runs = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      executedAt: d.data().executedAt?.toDate?.()?.toISOString() || d.data().executedAt,
    }));

    return NextResponse.json({ data: runs, total: runs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
