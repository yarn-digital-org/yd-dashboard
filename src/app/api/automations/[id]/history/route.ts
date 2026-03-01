import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/automations/[id]/history
 * Fetch execution history for an automation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const snapshot = await adminDb
      .collection('automation_runs')
      .where('automationId', '==', id)
      .orderBy('executedAt', 'desc')
      .limit(limit)
      .get();

    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        executedAt: data.executedAt?.toDate?.()?.toISOString() || data.executedAt,
      };
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching automation history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
